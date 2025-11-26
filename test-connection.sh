#!/bin/bash

# Script สำหรับทดสอบการเชื่อมต่อ MinIO และ R2
# ตรวจสอบ credentials และการเชื่อมต่อ

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

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

# ตรวจสอบ AWS CLI
check_aws_cli() {
    print_header "ตรวจสอบ AWS CLI"
    
    if command -v aws &> /dev/null; then
        local version=$(aws --version)
        print_success "AWS CLI พร้อมใช้งาน: $version"
        return 0
    else
        print_fail "AWS CLI ไม่ได้ติดตั้ง"
        return 1
    fi
}

# ทดสอบการเชื่อมต่อ MinIO
test_minio_connection() {
    print_header "ทดสอบการเชื่อมต่อ MinIO"
    
    # ตั้งค่า MinIO credentials
    export AWS_ACCESS_KEY_ID="nNpUordh7KlaW0WTivLW"
    export AWS_SECRET_ACCESS_KEY="32rxVkA5H7fr1AZ6JzJxDqgxFhp875qyuPPxILXJ"
    export AWS_DEFAULT_REGION="bkk-01"
    export MINIO_ENDPOINT="https://cdns.yellow-idea.com"
    
    print_status "MinIO Endpoint: $MINIO_ENDPOINT"
    print_status "MinIO Region: $AWS_DEFAULT_REGION"
    print_status "MinIO Access Key: ${AWS_ACCESS_KEY_ID:0:8}..."
    
    # ทดสอบการเชื่อมต่อ
    if aws s3 ls --endpoint-url $MINIO_ENDPOINT --region $AWS_DEFAULT_REGION &> /dev/null; then
        print_success "MinIO: เชื่อมต่อสำเร็จ"
        
        # แสดงรายการ buckets
        print_status "รายการ Buckets ใน MinIO:"
        aws s3 ls --endpoint-url $MINIO_ENDPOINT --region $AWS_DEFAULT_REGION 2>/dev/null | while read -r line; do
            if [[ $line =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2} ]]; then
                bucket_name=$(echo "$line" | awk '{print $4}')
                print_status "  - $bucket_name"
            fi
        done
        return 0
    else
        print_fail "MinIO: ไม่สามารถเชื่อมต่อได้"
        print_error "กรุณาตรวจสอบ:"
        print_error "  - Endpoint URL"
        print_error "  - Access Key และ Secret Key"
        print_error "  - Network connectivity"
        return 1
    fi
}

# ทดสอบการเชื่อมต่อ R2
test_r2_connection() {
    print_header "ทดสอบการเชื่อมต่อ Cloudflare R2"
    
    # ตั้งค่า R2 credentials
    export AWS_ACCESS_KEY_ID="87c6e3787729d7456e0568b6825f669b"
    export AWS_SECRET_ACCESS_KEY="c0df1bf6bfefba21dd52f9afc5264894186ab054e34eca69e5dae65fac332db0"
    export AWS_DEFAULT_REGION="auto"
    
    print_status "R2 Access Key: ${AWS_ACCESS_KEY_ID:0:8}..."
    
    # ทดสอบการเชื่อมต่อ
    if aws s3 ls &> /dev/null; then
        print_success "R2: เชื่อมต่อสำเร็จ"
        
        # แสดงรายการ buckets
        print_status "รายการ Buckets ใน R2:"
        aws s3 ls 2>/dev/null | while read -r line; do
            if [[ $line =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2} ]]; then
                bucket_name=$(echo "$line" | awk '{print $3}')
                print_status "  - $bucket_name"
            fi
        done
        return 0
    else
        print_fail "R2: ไม่สามารถเชื่อมต่อได้"
        print_error "กรุณาตรวจสอบ:"
        print_error "  - Access Key และ Secret Key"
        print_error "  - Network connectivity"
        return 1
    fi
}

# ทดสอบการ sync ไฟล์เล็ก
test_sync_small_file() {
    print_header "ทดสอบการ Sync ไฟล์เล็ก"
    
    local test_bucket="test-sync"
    local test_file="test-sync-file.txt"
    
    # สร้างไฟล์ทดสอบ
    echo "This is a test file for sync $(date)" > "$test_file"
    
    # อัปโหลดไปยัง MinIO
    print_status "อัปโหลดไฟล์ไปยัง MinIO..."
    if aws s3 cp "$test_file" "s3://$test_bucket/$test_file" --endpoint-url $MINIO_ENDPOINT --region $AWS_DEFAULT_REGION &> /dev/null; then
        print_success "อัปโหลดไปยัง MinIO สำเร็จ"
        
        # Sync ไปยัง R2
        print_status "Sync ไปยัง R2..."
        if aws s3 sync "s3://$test_bucket" "s3://$test_bucket" --endpoint-url $MINIO_ENDPOINT --region $MINIO_REGION &> /dev/null; then
            print_success "Sync ไปยัง R2 สำเร็จ"
            
            # ลบไฟล์ทดสอบ
            rm -f "$test_file"
            print_status "ลบไฟล์ทดสอบเรียบร้อย"
            return 0
        else
            print_fail "Sync ไปยัง R2 ล้มเหลว"
            rm -f "$test_file"
            return 1
        fi
    else
        print_fail "อัปโหลดไปยัง MinIO ล้มเหลว"
        rm -f "$test_file"
        return 1
    fi
}

# ฟังก์ชันสำหรับแสดง help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -m, --minio                  ทดสอบ MinIO เท่านั้น"
    echo "  -r, --r2                     ทดสอบ R2 เท่านั้น"
    echo "  -s, --sync                   ทดสอบการ sync"
    echo "  -a, --all                    ทดสอบทั้งหมด"
    echo "  -h, --help                   แสดง help"
    echo ""
    echo "Examples:"
    echo "  $0 -a"
    echo "  $0 -m"
    echo "  $0 -r"
}

# ตัวแปรเริ่มต้น
TEST_MINIO=false
TEST_R2=false
TEST_SYNC=false
TEST_ALL=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--minio)
            TEST_MINIO=true
            shift
            ;;
        -r|--r2)
            TEST_R2=true
            shift
            ;;
        -s|--sync)
            TEST_SYNC=true
            shift
            ;;
        -a|--all)
            TEST_ALL=true
            shift
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
print_header "เริ่มต้นการทดสอบการเชื่อมต่อ"

# ตรวจสอบ AWS CLI
if ! check_aws_cli; then
    exit 1
fi

# ถ้าไม่ระบุ option ให้ทดสอบทั้งหมด
if [ "$TEST_MINIO" = false ] && [ "$TEST_R2" = false ] && [ "$TEST_SYNC" = false ] && [ "$TEST_ALL" = false ]; then
    TEST_ALL=true
fi

# ทดสอบตามที่เลือก
if [ "$TEST_ALL" = true ] || [ "$TEST_MINIO" = true ]; then
    test_minio_connection
fi

if [ "$TEST_ALL" = true ] || [ "$TEST_R2" = true ]; then
    test_r2_connection
fi

if [ "$TEST_ALL" = true ] || [ "$TEST_SYNC" = true ]; then
    test_sync_small_file
fi

print_header "การทดสอบเสร็จสิ้น" 