// TODO localでも定義 DynamoDB Localめんどいので S3も
resource "aws_dynamodb_table" "generated_images" {
    name = "GeneratedImages"
    billing_mode = "PAY_PER_REQUEST"
    hash_key = "Key"

    attribute {
      name = "Key"
      type = "S"
    }
}