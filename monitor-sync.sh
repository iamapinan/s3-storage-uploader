#!/bin/bash

# Script สำหรับ monitoring การ sync และจัดการ logs
# แสดงสถานะการ sync และจัดการไฟล์ logs

# ตั้งค่าสีสำหรับ output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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
    echo -e "${BLUE}[MONITOR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# ฟังก์ชันสำหรับแสดงสถานะการ sync
show_sync_status() {
    print_header "สถานะการ Sync"
    
    # ตรวจสอบ log file
    local log_file="sync.log"
    if [ -f "$log_file" ]; then
        local last_sync=$(tail -n 20 "$log_file" | grep -E "(SUCCESS|FAIL)" | tail -n 1)
        if [ -n "$last_sync" ]; then
            print_status "การ sync ล่าสุด: $last_sync"
        else
            print_warning "ไม่พบข้อมูลการ sync ล่าสุด"
        fi
        
        # นับจำนวนการ sync ที่สำเร็จและล้มเหลว
        local success_count=$(grep -c "SUCCESS" "$log_file" 2>/dev/null || echo "0")
        local fail_count=$(grep -c "FAIL" "$log_file" 2>/dev/null || echo "0")
        
        print_status "จำนวนการ sync ที่สำเร็จ: $success_count"
        print_status "จำนวนการ sync ที่ล้มเหลว: $fail_count"
    else
        print_warning "ไม่พบไฟล์ log: $log_file"
    fi
}

# ฟังก์ชันสำหรับแสดง log ล่าสุด
show_recent_logs() {
    local lines=${1:-20}
    local log_file="sync.log"
    
    print_header "Log ล่าสุด ($lines บรรทัด)"
    
    if [ -f "$log_file" ]; then
        tail -n "$lines" "$log_file" | while IFS= read -r line; do
            if [[ $line == *"SUCCESS"* ]]; then
                echo -e "${GREEN}$line${NC}"
            elif [[ $line == *"FAIL"* ]] || [[ $line == *"ERROR"* ]]; then
                echo -e "${RED}$line${NC}"
            elif [[ $line == *"WARNING"* ]]; then
                echo -e "${YELLOW}$line${NC}"
            else
                echo "$line"
            fi
        done
    else
        print_warning "ไม่พบไฟล์ log: $log_file"
    fi
}

# ฟังก์ชันสำหรับแสดง error logs
show_error_logs() {
    local lines=${1:-50}
    local log_file="sync.log"
    
    print_header "Error Logs ($lines บรรทัด)"
    
    if [ -f "$log_file" ]; then
        grep -i "error\|fail" "$log_file" | tail -n "$lines" | while IFS= read -r line; do
            echo -e "${RED}$line${NC}"
        done
    else
        print_warning "ไม่พบไฟล์ log: $log_file"
    fi
}

# ฟังก์ชันสำหรับตรวจสอบการเชื่อมต่อ
check_connections() {
    print_header "ตรวจสอบการเชื่อมต่อ"
    
    # ตรวจสอบ MinIO
    print_status "ตรวจสอบ MinIO..."
    if aws s3 ls --endpoint-url https://cdns.yellow-idea.com --region bkk-01 &> /dev/null; then
        print_success "MinIO: เชื่อมต่อได้"
    else
        print_fail "MinIO: ไม่สามารถเชื่อมต่อได้"
    fi
    
    # ตรวจสอบ R2
    print_status "ตรวจสอบ R2..."
    if aws s3 ls &> /dev/null; then
        print_success "R2: เชื่อมต่อได้"
    else
        print_fail "R2: ไม่สามารถเชื่อมต่อได้"
    fi
}

# ฟังก์ชันสำหรับแสดงสถิติ
show_statistics() {
    print_header "สถิติการ Sync"
    
    local log_file="sync.log"
    if [ ! -f "$log_file" ]; then
        print_warning "ไม่พบไฟล์ log สำหรับวิเคราะห์"
        return
    fi
    
    # นับจำนวนการ sync ตามวัน
    print_status "สถิติตามวัน:"
    grep "SUCCESS\|FAIL" "$log_file" | awk '{print $1}' | sort | uniq -c | while read count date; do
        if [ "$count" -gt 0 ]; then
            print_status "$date: $count ครั้ง"
        fi
    done
    
    # หา bucket ที่ sync บ่อยที่สุด
    print_status "Bucket ที่ sync บ่อยที่สุด:"
    grep "SUCCESS\|FAIL" "$log_file" | grep -o "bucket.*->.*bucket" | awk '{print $1}' | sort | uniq -c | sort -nr | head -5 | while read count bucket; do
        if [ "$count" -gt 0 ]; then
            print_status "$bucket: $count ครั้ง"
        fi
    done
}

# ฟังก์ชันสำหรับล้าง logs เก่า
cleanup_old_logs() {
    local days=${1:-30}
    local log_file="sync.log"
    
    print_header "ล้าง logs เก่า (มากกว่า $days วัน)"
    
    if [ -f "$log_file" ]; then
        # สร้าง backup
        local backup_file="sync.log.backup.$(date +%Y%m%d)"
        cp "$log_file" "$backup_file"
        print_status "สร้าง backup: $backup_file"
        
        # ลบ logs เก่า
        local temp_file=$(mktemp)
        awk -v days="$days" '
        BEGIN {
            cutoff = systime() - (days * 24 * 60 * 60)
        }
        {
            # พยายามหา timestamp ในบรรทัด
            if (match($0, /[0-9]{4}-[0-9]{2}-[0-9]{2}/)) {
                date_str = substr($0, RSTART, 10)
                gsub(/-/, " ", date_str)
                timestamp = mktime(date_str " 00 00 00")
                if (timestamp > cutoff) {
                    print $0
                }
            } else {
                # ถ้าไม่มี timestamp ให้เก็บไว้
                print $0
            }
        }' "$log_file" > "$temp_file"
        
        mv "$temp_file" "$log_file"
        print_status "ล้าง logs เก่าเรียบร้อย"
    else
        print_warning "ไม่พบไฟล์ log"
    fi
}

# ฟังก์ชันสำหรับแสดง disk usage
show_disk_usage() {
    print_header "Disk Usage"
    
    local current_dir=$(pwd)
    local log_size=$(du -h sync.log 2>/dev/null | cut -f1 || echo "0")
    local total_size=$(du -sh . 2>/dev/null | cut -f1 || echo "0")
    
    print_status "ขนาดไฟล์ log: $log_size"
    print_status "ขนาดโฟลเดอร์ปัจจุบัน: $total_size"
    
    # แสดง disk space ที่เหลือ
    local available_space=$(df -h . | tail -1 | awk '{print $4}')
    print_status "พื้นที่ว่าง: $available_space"
}

# ฟังก์ชันสำหรับแสดง help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -s, --status                 แสดงสถานะการ sync"
    echo "  -l, --logs [LINES]          แสดง log ล่าสุด (default: 20)"
    echo "  -e, --errors [LINES]        แสดง error logs (default: 50)"
    echo "  -c, --check                  ตรวจสอบการเชื่อมต่อ"
    echo "  -t, --stats                  แสดงสถิติ"
    echo "  -u, --usage                  แสดง disk usage"
    echo "  -r, --cleanup [DAYS]        ล้าง logs เก่า (default: 30 วัน)"
    echo "  -a, --all                    แสดงข้อมูลทั้งหมด"
    echo "  -h, --help                   แสดง help"
    echo ""
    echo "Examples:"
    echo "  $0 -s"
    echo "  $0 -l 50"
    echo "  $0 -r 7"
    echo "  $0 -a"
}

# ตัวแปรเริ่มต้น
SHOW_STATUS=false
SHOW_LOGS=false
SHOW_ERRORS=false
CHECK_CONNECTIONS=false
SHOW_STATS=false
SHOW_USAGE=false
CLEANUP_LOGS=false
SHOW_ALL=false
LOG_LINES=20
ERROR_LINES=50
CLEANUP_DAYS=30

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--status)
            SHOW_STATUS=true
            shift
            ;;
        -l|--logs)
            SHOW_LOGS=true
            if [[ $2 =~ ^[0-9]+$ ]]; then
                LOG_LINES=$2
                shift 2
            else
                shift
            fi
            ;;
        -e|--errors)
            SHOW_ERRORS=true
            if [[ $2 =~ ^[0-9]+$ ]]; then
                ERROR_LINES=$2
                shift 2
            else
                shift
            fi
            ;;
        -c|--check)
            CHECK_CONNECTIONS=true
            shift
            ;;
        -t|--stats)
            SHOW_STATS=true
            shift
            ;;
        -u|--usage)
            SHOW_USAGE=true
            shift
            ;;
        -r|--cleanup)
            CLEANUP_LOGS=true
            if [[ $2 =~ ^[0-9]+$ ]]; then
                CLEANUP_DAYS=$2
                shift 2
            else
                shift
            fi
            ;;
        -a|--all)
            SHOW_ALL=true
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
print_header "เริ่มต้น Sync Monitor"

# ถ้าไม่ระบุ option ให้แสดง help
if [ "$SHOW_STATUS" = false ] && [ "$SHOW_LOGS" = false ] && [ "$SHOW_ERRORS" = false ] && [ "$CHECK_CONNECTIONS" = false ] && [ "$SHOW_STATS" = false ] && [ "$SHOW_USAGE" = false ] && [ "$CLEANUP_LOGS" = false ] && [ "$SHOW_ALL" = false ]; then
    show_help
    exit 0
fi

# แสดงข้อมูลตามที่เลือก
if [ "$SHOW_ALL" = true ]; then
    show_sync_status
    check_connections
    show_statistics
    show_disk_usage
    show_recent_logs 20
    show_error_logs 10
else
    if [ "$SHOW_STATUS" = true ]; then
        show_sync_status
    fi
    
    if [ "$CHECK_CONNECTIONS" = true ]; then
        check_connections
    fi
    
    if [ "$SHOW_STATS" = true ]; then
        show_statistics
    fi
    
    if [ "$SHOW_USAGE" = true ]; then
        show_disk_usage
    fi
    
    if [ "$SHOW_LOGS" = true ]; then
        show_recent_logs $LOG_LINES
    fi
    
    if [ "$SHOW_ERRORS" = true ]; then
        show_error_logs $ERROR_LINES
    fi
    
    if [ "$CLEANUP_LOGS" = true ]; then
        cleanup_old_logs $CLEANUP_DAYS
    fi
fi

print_header "Monitor เสร็จสิ้น" 