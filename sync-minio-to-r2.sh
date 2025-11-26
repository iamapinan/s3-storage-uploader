#!/bin/bash

# Script สำหรับ sync ข้อมูลจาก MinIO ไปยัง Cloudflare R2
# ใช้ AWS CLI สำหรับ sync ข้อมูล

# ตั้งค่าสีสำหรับ output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ฟังก์ชันสำหรับแสดงข้อความ
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ตรวจสอบว่ามี AWS CLI หรือไม่
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI ไม่ได้ติดตั้ง กรุณาติดตั้ง AWS CLI ก่อน"
        exit 1
    fi
    print_status "AWS CLI พร้อมใช้งาน"
}

# ตั้งค่า AWS credentials สำหรับ R2
setup_r2_credentials() {
    export AWS_ACCESS_KEY_ID="87c6e3787729d7456e0568b6825f669b"
    export AWS_SECRET_ACCESS_KEY="c0df1bf6bfefba21dd52f9afc5264894186ab054e34eca69e5dae65fac332db0"
    export AWS_DEFAULT_REGION="auto"
    
    print_status "ตั้งค่า R2 credentials เรียบร้อย"
}

# ตั้งค่า MinIO credentials
setup_minio_credentials() {
    export MINIO_ACCESS_KEY_ID="nNpUordh7KlaW0WTivLW"
    export MINIO_SECRET_ACCESS_KEY="32rxVkA5H7fr1AZ6JzJxDqgxFhp875qyuPPxILXJ"
    export MINIO_REGION="bkk-01"
    export MINIO_ENDPOINT="https://cdns.yellow-idea.com"
    
    print_status "ตั้งค่า MinIO credentials เรียบร้อย"
}

# ฟังก์ชันสำหรับ sync ข้อมูล
sync_bucket() {
    local source_bucket=$1
    local destination_bucket=$2
    local source_endpoint=$3
    
    print_status "เริ่ม sync จาก $source_bucket ไปยัง $destination_bucket"
    
    # ใช้ AWS CLI sync command
    aws s3 sync \
        s3://$source_bucket \
        s3://$destination_bucket \
        --endpoint-url $source_endpoint \
        --region bkk-01 \
        --delete \
        --exclude "*.tmp" \
        --exclude "*.temp" \
        --exclude ".DS_Store" \
        --exclude "Thumbs.db"
    
    if [ $? -eq 0 ]; then
        print_status "Sync เรียบร้อย: $source_bucket -> $destination_bucket"
    else
        print_error "Sync ล้มเหลว: $source_bucket -> $destination_bucket"
        return 1
    fi
}

# ฟังก์ชันสำหรับ sync ไฟล์เดียว
sync_file() {
    local source_bucket=$1
    local source_key=$2
    local destination_bucket=$3
    local destination_key=$4
    local source_endpoint=$5
    
    print_status "เริ่ม sync ไฟล์: $source_key"
    
    aws s3 cp \
        s3://$source_bucket/$source_key \
        s3://$destination_bucket/$destination_key \
        --endpoint-url $source_endpoint \
        --region bkk-01
    
    if [ $? -eq 0 ]; then
        print_status "Sync ไฟล์เรียบร้อย: $source_key"
    else
        print_error "Sync ไฟล์ล้มเหลว: $source_key"
        return 1
    fi
}

# ฟังก์ชันสำหรับแสดง help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -b, --bucket BUCKET_NAME    Sync ทั้ง bucket"
    echo "  -f, --file SOURCE_KEY       Sync ไฟล์เดียว"
    echo "  -s, --source-endpoint URL   MinIO endpoint (default: http://localhost:9000)"
    echo "  -d, --dest-bucket BUCKET    Destination bucket name"
    echo "  -k, --dest-key KEY          Destination key (สำหรับไฟล์เดียว)"
    echo "  -h, --help                  แสดง help"
    echo ""
    echo "Examples:"
    echo "  $0 -b my-bucket -s http://localhost:9000 -d my-r2-bucket"
    echo "  $0 -f path/to/file.jpg -s http://localhost:9000 -d my-r2-bucket -k new/path/file.jpg"
}

# ตัวแปรเริ่มต้น
SOURCE_ENDPOINT="https://cdns.yellow-idea.com"
DEST_BUCKET=""
SOURCE_BUCKET=""
SOURCE_FILE=""
DEST_KEY=""
SYNC_MODE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--bucket)
            SOURCE_BUCKET="$2"
            SYNC_MODE="bucket"
            shift 2
            ;;
        -f|--file)
            SOURCE_FILE="$2"
            SYNC_MODE="file"
            shift 2
            ;;
        -s|--source-endpoint)
            SOURCE_ENDPOINT="$2"
            shift 2
            ;;
        -d|--dest-bucket)
            DEST_BUCKET="$2"
            shift 2
            ;;
        -k|--dest-key)
            DEST_KEY="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# ตรวจสอบ parameters ที่จำเป็น
if [ -z "$DEST_BUCKET" ]; then
    print_error "กรุณาระบุ destination bucket (-d หรือ --dest-bucket)"
    exit 1
fi

if [ "$SYNC_MODE" = "bucket" ] && [ -z "$SOURCE_BUCKET" ]; then
    print_error "กรุณาระบุ source bucket (-b หรือ --bucket)"
    exit 1
fi

if [ "$SYNC_MODE" = "file" ] && [ -z "$SOURCE_FILE" ]; then
    print_error "กรุณาระบุ source file (-f หรือ --file)"
    exit 1
fi

if [ "$SYNC_MODE" = "file" ] && [ -z "$DEST_KEY" ]; then
    DEST_KEY="$SOURCE_FILE"
    print_warning "ไม่ระบุ destination key ใช้ชื่อไฟล์เดิม: $DEST_KEY"
fi

# เริ่มต้น script
print_status "เริ่มต้น MinIO to R2 Sync Script"

# ตรวจสอบ AWS CLI
check_aws_cli

# ตั้งค่า credentials
setup_r2_credentials
setup_minio_credentials

# ตรวจสอบการเชื่อมต่อ MinIO
print_status "ตรวจสอบการเชื่อมต่อ MinIO..."
if aws s3 ls --endpoint-url $SOURCE_ENDPOINT --region bkk-01 &> /dev/null; then
    print_status "เชื่อมต่อ MinIO สำเร็จ"
else
    print_error "ไม่สามารถเชื่อมต่อ MinIO ได้ กรุณาตรวจสอบ endpoint และ credentials"
    exit 1
fi

# ตรวจสอบการเชื่อมต่อ R2
print_status "ตรวจสอบการเชื่อมต่อ R2..."
if aws s3 ls s3://$DEST_BUCKET &> /dev/null; then
    print_status "เชื่อมต่อ R2 สำเร็จ"
else
    print_warning "ไม่สามารถเข้าถึง destination bucket ได้ อาจจะยังไม่มี bucket นี้"
fi

# ทำการ sync ตาม mode ที่เลือก
if [ "$SYNC_MODE" = "bucket" ]; then
    sync_bucket "$SOURCE_BUCKET" "$DEST_BUCKET" "$SOURCE_ENDPOINT"
elif [ "$SYNC_MODE" = "file" ]; then
    sync_file "$SOURCE_BUCKET" "$SOURCE_FILE" "$DEST_BUCKET" "$DEST_KEY" "$SOURCE_ENDPOINT"
else
    print_error "กรุณาระบุ mode (-b สำหรับ bucket หรือ -f สำหรับไฟล์เดียว)"
    show_help
    exit 1
fi

print_status "Sync เสร็จสิ้น" 