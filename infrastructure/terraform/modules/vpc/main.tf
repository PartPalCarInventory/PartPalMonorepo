data "aws_availability_zones" "available" {}

locals {
  max_subnet_length = max(
    length(var.private_subnets),
    length(var.public_subnets),
    length(var.database_subnets),
  )
  nat_gateway_count = var.single_nat_gateway ? 1 : (var.one_nat_gateway_per_az ? length(var.azs) : local.max_subnet_length)
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = merge(
    { Name = var.name },
    var.tags,
    var.vpc_tags
  )
}

# DHCP Options Set
resource "aws_vpc_dhcp_options" "main" {
  count = var.enable_dhcp_options ? 1 : 0

  domain_name          = var.dhcp_options_domain_name
  domain_name_servers  = var.dhcp_options_domain_name_servers
  ntp_servers          = var.dhcp_options_ntp_servers
  netbios_name_servers = var.dhcp_options_netbios_name_servers
  netbios_node_type    = var.dhcp_options_netbios_node_type

  tags = merge(
    { Name = var.name },
    var.tags,
    var.dhcp_options_tags
  )
}

resource "aws_vpc_dhcp_options_association" "main" {
  count = var.enable_dhcp_options ? 1 : 0

  vpc_id          = aws_vpc.main.id
  dhcp_options_id = aws_vpc_dhcp_options.main[0].id
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  count = length(var.public_subnets) > 0 ? 1 : 0

  vpc_id = aws_vpc.main.id

  tags = merge(
    { Name = var.name },
    var.tags,
    var.igw_tags
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnets)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = element(concat(var.public_subnets, [""]), count.index)
  availability_zone       = element(var.azs, count.index)
  map_public_ip_on_launch = var.map_public_ip_on_launch

  tags = merge(
    {
      Name = format("${var.name}-public-%s", element(var.azs, count.index))
      Type = "Public"
    },
    var.tags,
    var.public_subnet_tags
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnets)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnets[count.index]
  availability_zone = element(var.azs, count.index)

  tags = merge(
    {
      Name = format("${var.name}-private-%s", element(var.azs, count.index))
      Type = "Private"
    },
    var.tags,
    var.private_subnet_tags
  )
}

# Database Subnets
resource "aws_subnet" "database" {
  count = length(var.database_subnets)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.database_subnets[count.index]
  availability_zone = element(var.azs, count.index)

  tags = merge(
    {
      Name = format("${var.name}-db-%s", element(var.azs, count.index))
      Type = "Database"
    },
    var.tags,
    var.database_subnet_tags
  )
}

resource "aws_db_subnet_group" "database" {
  count = length(var.database_subnets) > 0 ? 1 : 0

  name       = lower(var.name)
  subnet_ids = aws_subnet.database[*].id

  tags = merge(
    { Name = var.name },
    var.tags,
    var.database_subnet_group_tags
  )
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "elasticache" {
  count = length(var.database_subnets) > 0 ? 1 : 0

  name       = lower(var.name)
  subnet_ids = aws_subnet.database[*].id
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? local.nat_gateway_count : 0

  domain = "vpc"

  tags = merge(
    {
      Name = format("${var.name}-nat-%s", element(var.azs, var.single_nat_gateway ? 0 : count.index))
    },
    var.tags,
    var.nat_eip_tags
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? local.nat_gateway_count : 0

  allocation_id = element(aws_eip.nat[*].id, var.single_nat_gateway ? 0 : count.index)
  subnet_id     = element(aws_subnet.public[*].id, var.single_nat_gateway ? 0 : count.index)

  tags = merge(
    {
      Name = format("${var.name}-nat-%s", element(var.azs, var.single_nat_gateway ? 0 : count.index))
    },
    var.tags,
    var.nat_gateway_tags
  )

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  count = length(var.public_subnets) > 0 ? 1 : 0

  vpc_id = aws_vpc.main.id

  tags = merge(
    { Name = "${var.name}-public" },
    var.tags,
    var.public_route_table_tags
  )
}

resource "aws_route_table" "private" {
  count = var.single_nat_gateway ? 1 : length(var.private_subnets)

  vpc_id = aws_vpc.main.id

  tags = merge(
    {
      Name = var.single_nat_gateway ? "${var.name}-private" : format("${var.name}-private-%s", element(var.azs, count.index))
    },
    var.tags,
    var.private_route_table_tags
  )
}

resource "aws_route_table" "database" {
  count = length(var.database_subnets) > 0 ? 1 : 0

  vpc_id = aws_vpc.main.id

  tags = merge(
    { Name = "${var.name}-database" },
    var.tags,
    var.database_route_table_tags
  )
}

# Routes
resource "aws_route" "public_internet_gateway" {
  count = length(var.public_subnets) > 0 ? 1 : 0

  route_table_id         = aws_route_table.public[0].id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main[0].id

  timeouts {
    create = "5m"
  }
}

resource "aws_route" "private_nat_gateway" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.private_subnets)) : 0

  route_table_id         = element(aws_route_table.private[*].id, count.index)
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = element(aws_nat_gateway.main[*].id, var.single_nat_gateway ? 0 : count.index)

  timeouts {
    create = "5m"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(var.public_subnets)

  subnet_id      = element(aws_subnet.public[*].id, count.index)
  route_table_id = aws_route_table.public[0].id
}

resource "aws_route_table_association" "private" {
  count = length(var.private_subnets)

  subnet_id      = element(aws_subnet.private[*].id, count.index)
  route_table_id = element(aws_route_table.private[*].id, var.single_nat_gateway ? 0 : count.index)
}

resource "aws_route_table_association" "database" {
  count = length(var.database_subnets)

  subnet_id      = element(aws_subnet.database[*].id, count.index)
  route_table_id = aws_route_table.database[0].id
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  count = var.enable_flow_log ? 1 : 0

  iam_role_arn    = aws_iam_role.flow_log[0].arn
  log_destination = aws_cloudwatch_log_group.main[0].arn
  traffic_type    = var.flow_log_traffic_type
  vpc_id          = aws_vpc.main.id
}

resource "aws_cloudwatch_log_group" "main" {
  count = var.enable_flow_log ? 1 : 0

  name              = "${var.name}-vpc-flow-logs"
  retention_in_days = var.flow_log_retention_in_days
}

resource "aws_iam_role" "flow_log" {
  count = var.enable_flow_log ? 1 : 0

  name = "${var.name}-flow-log"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "vpc-flow-logs.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "flow_log" {
  count = var.enable_flow_log ? 1 : 0

  name = "${var.name}-flow-log"
  role = aws_iam_role.flow_log[0].id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}