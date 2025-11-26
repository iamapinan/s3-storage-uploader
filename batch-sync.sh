#!/bin/bash

# Script สำหรับ sync แบบ batch จาก MinIO ไปยัง Cloudflare R2
# ใช้ไฟล์ config สำหรับกำหนด bucket mappings

# ตั้งค่าสีสำหรับ output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}[BATCH]${NC} $1"
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

# ฟังก์ชันสำหรับ sync bucket เดียว
sync_single_bucket() {
    local source_bucket=$1
    local destination_bucket=$2
    local source_endpoint=$3
    
    print_header "เริ่ม sync: $source_bucket -> $destination_bucket"
    
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
        --exclude "Thumbs.db" \
        --exclude "*.log" \
        --exclude "*.cache"
    
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        print_status "Sync สำเร็จ: $source_bucket -> $destination_bucket"
        return 0
    else
        print_error "Sync ล้มเหลว: $source_bucket -> $destination_bucket (exit code: $exit_code)"
        return 1
    fi
}

# ฟังก์ชันสำหรับอ่าน config file
read_config() {
    local config_file=$1
    
    if [ ! -f "$config_file" ]; then
        print_error "ไม่พบไฟล์ config: $config_file"
        exit 1
    fi
    
    # อ่าน config file และเก็บใน array
    local line_number=0
    local success_count=0
    local error_count=0
    
    while IFS=',' read -r source_bucket dest_bucket; do
        line_number=$((line_number + 1))
        
        # ข้าม comment lines และ empty lines
        if [[ $source_bucket =~ ^[[:space:]]*# ]] || [[ -z "${source_bucket// }" ]]; then
            continue
        fi
        
        # ตัด whitespace
        source_bucket=$(echo "$source_bucket" | xargs)
        dest_bucket=$(echo "$dest_bucket" | xargs)
        
        if [ -z "$source_bucket" ] || [ -z "$dest_bucket" ]; then
            print_warning "ข้ามบรรทัดที่ $line_number: ข้อมูลไม่ครบ"
            continue
        fi
        
        print_status "กำลัง sync: $source_bucket -> $dest_bucket"
        
        if sync_single_bucket "$source_bucket" "$dest_bucket" "$SOURCE_ENDPOINT"; then
            success_count=$((success_count + 1))
        else
            error_count=$((error_count + 1))
        fi
        
        # หยุดพักระหว่าง sync เพื่อไม่ให้ server หนักเกินไป
        sleep 2
        
    done < "$config_file"
    
    print_header "สรุปผลการ sync:"
    print_status "สำเร็จ: $success_count buckets"
    if [ $error_count -gt 0 ]; then
        print_error "ล้มเหลว: $error_count buckets"
    fi
}

# ฟังก์ชันสำหรับสร้าง config template
create_config_template() {
    local template_file="sync-config.csv"
    
    cat > "$template_file" << EOF
# MinIO to R2 Sync Configuration
# Format: source_bucket,destination_bucket
# Lines starting with # are comments
# Empty lines are ignored

# Example:
# my-minio-bucket,my-r2-bucket
# images,cdn-images
# documents,backup-docs

EOF
    
    print_status "สร้างไฟล์ config template: $template_file"
    print_status "กรุณาแก้ไขไฟล์นี้เพื่อกำหนด bucket mappings"
}

# ฟังก์ชันสำหรับแสดง help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -c, --config FILE           ไฟล์ config CSV (default: sync-config.csv)"
    echo "  -s, --source-endpoint URL   MinIO endpoint (default: http://localhost:9000)"
    echo "  -t, --template              สร้างไฟล์ config template"
    echo "  -h, --help                  แสดง help"
    echo ""
    echo "Config file format (CSV):"
    echo "  source_bucket,destination_bucket"
    echo "  my-bucket,my-r2-bucket"
    echo ""
    echo "Examples:"
    echo "  $0 -c my-config.csv"
    echo "  $0 -t"
}

# ตัวแปรเริ่มต้น
CONFIG_FILE="sync-config.csv"
SOURCE_ENDPOINT="https://cdns.yellow-idea.com"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -s|--source-endpoint)
            SOURCE_ENDPOINT="$2"
            shift 2
            ;;
        -t|--template)
            create_config_template
            exit 0
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

# เริ่มต้น script
print_header "เริ่มต้น Batch MinIO to R2 Sync Script"

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
if aws s3 ls &> /dev/null; then
    print_status "เชื่อมต่อ R2 สำเร็จ"
else
    print_error "ไม่สามารถเชื่อมต่อ R2 ได้ กรุณาตรวจสอบ credentials"
    exit 1
fi

# อ่านและประมวลผล config file
print_status "เริ่มอ่าน config file: $CONFIG_FILE"
read_config "$CONFIG_FILE"

print_header "Batch sync เสร็จสิ้น" 