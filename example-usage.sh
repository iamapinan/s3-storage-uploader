#!/bin/bash

# ตัวอย่างการใช้งาน MinIO to R2 Sync Scripts
# ไฟล์นี้แสดงวิธีการใช้งาน scripts ต่างๆ

echo "=== ตัวอย่างการใช้งาน MinIO to R2 Sync Scripts ==="
echo ""

echo "1. ตั้งค่า Environment:"
echo "   ./setup-env.sh"
echo ""

echo "2. Sync Bucket เดียว:"
echo "   ./sync-minio-to-r2.sh -b my-bucket -d my-r2-bucket"
echo "   ./sync-minio-to-r2.sh -b images -d cdn-images -s https://cdns.yellow-idea.com"
echo ""

echo "3. Sync ไฟล์เดียว:"
echo "   ./sync-minio-to-r2.sh -f path/to/file.jpg -d my-r2-bucket"
echo "   ./sync-minio-to-r2.sh -f uploads/image.jpg -d public-bucket -k images/image.jpg"
echo ""

echo "4. Batch Sync:"
echo "   # สร้าง config template"
echo "   ./batch-sync.sh -t"
echo "   # แก้ไขไฟล์ sync-config.csv แล้วรัน"
echo "   ./batch-sync.sh"
echo "   ./batch-sync.sh -c my-config.csv"
echo ""

echo "5. Monitoring:"
echo "   # แสดงสถานะ"
echo "   ./monitor-sync.sh -s"
echo "   # แสดง logs ล่าสุด"
echo "   ./monitor-sync.sh -l 50"
echo "   # แสดง error logs"
echo "   ./monitor-sync.sh -e 20"
echo "   # ตรวจสอบการเชื่อมต่อ"
echo "   ./monitor-sync.sh -c"
echo "   # แสดงสถิติ"
echo "   ./monitor-sync.sh -t"
echo "   # แสดงข้อมูลทั้งหมด"
echo "   ./monitor-sync.sh -a"
echo ""

echo "6. การตั้งค่าไฟล์ Config:"
echo "   # แก้ไขไฟล์ .env สำหรับ MinIO credentials"
echo "   # แก้ไขไฟล์ sync-config.csv สำหรับ bucket mappings"
echo ""

echo "7. ตัวอย่างไฟล์ sync-config.csv:"
echo "   my-bucket,my-r2-bucket"
echo "   images,cdn-images"
echo "   documents,backup-docs"
echo "   uploads,public-uploads"
echo ""

echo "8. การจัดการ Logs:"
echo "   # ล้าง logs เก่า (30 วัน)"
echo "   ./monitor-sync.sh -r"
echo "   # ล้าง logs เก่า (7 วัน)"
echo "   ./monitor-sync.sh -r 7"
echo ""

echo "=== หมายเหตุ ==="
echo "- ตรวจสอบ MinIO endpoint และ credentials ก่อนใช้งาน"
echo "- ตรวจสอบ R2 credentials ใน script"
echo "- ใช้ AWS CLI สำหรับการ sync"
echo "- ดูรายละเอียดเพิ่มเติมในไฟล์ SYNC_README.md" 