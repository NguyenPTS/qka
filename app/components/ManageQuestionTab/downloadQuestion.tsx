import React from "react";
import ExcelJS from "exceljs";

const DownloadQuestion: React.FC = () => {
  const handleDownloadXLSX = async () => {
    const res = await fetch("/api/questions/status");
    const data = await res.json();
    const questions = data.data || [];

    const headers = [
      "STT",
      "Câu hỏi",
      "Từ khóa",
      "Câu trả lời",
      "Ảnh",
      "Ngày tạo"
    ];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Questions");

    worksheet.addRow(headers);

    worksheet.getColumn(1).width = 6;
    worksheet.getColumn(2).width = 60;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 120;
    worksheet.getColumn(5).width = 80;
    worksheet.getColumn(6).width = 30;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const rowIdx = i + 2;
      const keywords = Array.isArray(q.keyword) ? q.keyword.join(", ") : q.keyword;
      // Chỉ đưa link ảnh vào cột Ảnh, phân cách bằng xuống dòng nếu nhiều ảnh
      let imagesStr = '';
      if (q.images && Array.isArray(q.images)) {
        imagesStr = q.images.map((img: any) => (typeof img === 'string' ? img : img.url)).join('\n');
      } else if (typeof q.images === 'string') {
        imagesStr = q.images;
      }
      worksheet.addRow([
        i + 1,
        q.question,
        keywords,
        q.answer,
        imagesStr,
        q.createdAt ? new Date(q.createdAt).toLocaleString() : ""
      ]);
      worksheet.getRow(rowIdx).height = 40;
    }

    // Style header
    worksheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2563EB" }
      };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    });

    // Style data rows: wrapText cho tất cả cell
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell((cell, colNumber) => {
        if (colNumber === 1) {
          cell.alignment = { vertical: "top", horizontal: "center", wrapText: true };
        } else {
          cell.alignment = { vertical: "top", horizontal: "left", wrapText: true };
        }
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });
      // Tự động điều chỉnh chiều cao dòng dựa trên độ dài cột Câu trả lời (cột 4)
      const answer = row.getCell(4).value as string;
      const charPerLine = 60;
      const lineBreaks = answer ? (answer.match(/\n/g) || []).length : 0;
      const approxLines = answer ? Math.ceil(answer.length / charPerLine) + lineBreaks : 1;
      row.height = Math.max(40, approxLines * 20);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Multivit_FAQ.xlsx";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
  };

  return (
    <button
      onClick={handleDownloadXLSX}
      className="px-4 py-2 bg-green-600 text-white rounded-md"
    >
      Download XLSX
    </button>
  );
};

export default DownloadQuestion;
