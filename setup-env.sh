#!/bin/bash

# Script สำหรับตั้งค่า environment สำหรับ MinIO to R2 sync
# ตรวจสอบและติดตั้ง dependencies ที่จำเป็น

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
    echo -e "${BLUE}[SETUP]${NC} $1"
}

# ตรวจสอบ OS
check_os() {
    print_header "ตรวจสอบ Operating System"
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        print_status "พบ Linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        print_status "พบ macOS"
    else
        print_error "ไม่รองรับ OS นี้: $OSTYPE"
        exit 1
    fi
}

# ตรวจสอบและติดตั้ง AWS CLI
install_aws_cli() {
    print_header "ตรวจสอบ AWS CLI"
    
    if command -v aws &> /dev/null; then
        local version=$(aws --version)
        print_status "AWS CLI ติดตั้งแล้ว: $version"
        return 0
    fi
    
    print_warning "AWS CLI ไม่ได้ติดตั้ง กำลังติดตั้ง..."
    
    if [ "$OS" = "macos" ]; then
        # ติดตั้งผ่าน Homebrew
        if command -v brew &> /dev/null; then
            print_status "ติดตั้ง AWS CLI ผ่าน Homebrew"
            brew install awscli
        else
            print_error "ไม่พบ Homebrew กรุณาติดตั้ง Homebrew ก่อน"
            print_status "รันคำสั่ง: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    elif [ "$OS" = "linux" ]; then
        # ติดตั้งผ่าน package manager
        if command -v apt-get &> /dev/null; then
            print_status "ติดตั้ง AWS CLI ผ่าน apt"
            sudo apt-get update
            sudo apt-get install -y awscli
        elif command -v yum &> /dev/null; then
            print_status "ติดตั้ง AWS CLI ผ่าน yum"
            sudo yum install -y awscli
        else
            print_error "ไม่พบ package manager ที่รองรับ"
            print_status "กรุณาติดตั้ง AWS CLI เอง: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
            exit 1
        fi
    fi
    
    # ตรวจสอบการติดตั้ง
    if command -v aws &> /dev/null; then
        local version=$(aws --version)
        print_status "AWS CLI ติดตั้งสำเร็จ: $version"
    else
        print_error "การติดตั้ง AWS CLI ล้มเหลว"
        exit 1
    fi
}

# สร้างไฟล์ environment
create_env_file() {
    print_header "สร้างไฟล์ environment"
    
    local env_file=".env"
    
    cat > "$env_file" << EOF
# MinIO to R2 Sync Environment Configuration

# MinIO Configuration
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=your_minio_access_key
MINIO_SECRET_KEY=your_minio_secret_key

# Cloudflare R2 Configuration
R2_ACCESS_KEY_ID=87c6e3787729d7456e0568b6825f669b
R2_SECRET_ACCESS_KEY=c0df1bf6bfefba21dd52f9afc5264894186ab054e34eca69e5dae65fac332db0
R2_ENDPOINT=https://179644dc24aa93a7a89cb338e6f72cd6.r2.cloudflarestorage.com
R2_REGION=auto

# Sync Configuration
DEFAULT_SOURCE_ENDPOINT=http://localhost:9000
DEFAULT_DEST_BUCKET=your_r2_bucket_name

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=sync.log

# Performance Configuration
BATCH_SIZE=100
MAX_CONCURRENT_SYNC=3
SYNC_DELAY=2

EOF
    
    print_status "สร้างไฟล์ $env_file เรียบร้อย"
    print_warning "กรุณาแก้ไขไฟล์ $env_file เพื่อตั้งค่า MinIO credentials"
}

# สร้างไฟล์ config template
create_config_template() {
    print_header "สร้างไฟล์ config template"
    
    local config_file="sync-config.csv"
    
    cat > "$config_file" << EOF
# MinIO to R2 Sync Configuration
# Format: source_bucket,destination_bucket
# Lines starting with # are comments
# Empty lines are ignored

# Example configurations:
# my-minio-bucket,my-r2-bucket
# images,cdn-images
# documents,backup-docs
# uploads,public-uploads

EOF
    
    print_status "สร้างไฟล์ $config_file เรียบร้อย"
    print_warning "กรุณาแก้ไขไฟล์ $config_file เพื่อกำหนด bucket mappings"
}

# ตั้งค่า permissions สำหรับ scripts
set_permissions() {
    print_header "ตั้งค่า permissions สำหรับ scripts"
    
    chmod +x sync-minio-to-r2.sh
    chmod +x batch-sync.sh
    chmod +x setup-env.sh
    
    print_status "ตั้งค่า permissions เรียบร้อย"
}

# สร้างไฟล์ README
create_readme() {
    print_header "สร้างไฟล์ README"
    
    local readme_file="SYNC_README.md"
    
    cat > "$readme_file" << 'EOF'
# MinIO to Cloudflare R2 Sync Scripts

ชุด script สำหรับ sync ข้อมูลจาก MinIO ไปยัง Cloudflare R2

## ไฟล์ที่รวมอยู่

- `sync-minio-to-r2.sh` - Script สำหรับ sync bucket หรือไฟล์เดียว
- `batch-sync.sh` - Script สำหรับ sync แบบ batch หลาย bucket
- `setup-env.sh` - Script สำหรับตั้งค่า environment
- `sync-config.csv` - ไฟล์ config สำหรับ batch sync

## การใช้งาน

### 1. ตั้งค่า Environment
```bash
./setup-env.sh
```

### 2. Sync Bucket เดียว
```bash
./sync-minio-to-r2.sh -b my-bucket -d my-r2-bucket
```

### 3. Sync ไฟล์เดียว
```bash
./sync-minio-to-r2.sh -f path/to/file.jpg -d my-r2-bucket -k new/path/file.jpg
```

### 4. Batch Sync
```bash
# สร้าง config template
./batch-sync.sh -t

# แก้ไขไฟล์ sync-config.csv แล้วรัน
./batch-sync.sh
```

## การตั้งค่า

1. แก้ไขไฟล์ `.env` เพื่อตั้งค่า MinIO credentials
2. แก้ไขไฟล์ `sync-config.csv` เพื่อกำหนด bucket mappings
3. ตรวจสอบ R2 credentials ใน script (ถ้าจำเป็น)

## ข้อกำหนด

- AWS CLI
- MinIO server
- Cloudflare R2 account

## Troubleshooting

- ตรวจสอบ MinIO endpoint และ credentials
- ตรวจสอบ R2 credentials และ permissions
- ตรวจสอบ network connectivity
- ดู log ในไฟล์ sync.log

EOF
    
    print_status "สร้างไฟล์ $readme_file เรียบร้อย"
}

# ฟังก์ชันสำหรับแสดง help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -f, --force                 บังคับติดตั้งใหม่"
    echo "  -s, --skip-deps             ข้ามการตรวจสอบ dependencies"
    echo "  -h, --help                  แสดง help"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  $0 -f"
}

# ตัวแปรเริ่มต้น
FORCE_INSTALL=false
SKIP_DEPS=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--force)
            FORCE_INSTALL=true
            shift
            ;;
        -s|--skip-deps)
            SKIP_DEPS=true
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
print_header "เริ่มต้นการตั้งค่า Environment"

# ตรวจสอบ OS
check_os

# ตรวจสอบและติดตั้ง dependencies
if [ "$SKIP_DEPS" = false ]; then
    install_aws_cli
fi

# สร้างไฟล์ต่างๆ
create_env_file
create_config_template
create_readme

# ตั้งค่า permissions
set_permissions

print_header "การตั้งค่าเสร็จสิ้น"
print_status "กรุณาแก้ไขไฟล์ .env และ sync-config.csv เพื่อตั้งค่าการใช้งาน"
print_status "ดูรายละเอียดเพิ่มเติมในไฟล์ SYNC_README.md" 