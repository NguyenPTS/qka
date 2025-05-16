/**
 * Hàm lưu câu hỏi từ tab Sale vào MongoDB
 * 
 * Sử dụng: Import vào page.tsx và gọi từ hàm addSaleQuestion
 * 
 * @param question Nội dung câu hỏi
 * @returns Dữ liệu câu hỏi đã lưu
 */

export async function saveSaleQuestionToMongoDB(question: string) {
  // Định dạng dữ liệu theo cấu trúc Question
  const questionData = {
    question: question, // Text câu hỏi
    keyword: [],        // Mảng keyword trống
    answer: "",         // Câu trả lời trống 
    images: [],         // Mảng ảnh trống
    createdAt: new Date().toISOString(),
    source: "sale"      // Nguồn từ sale
  };
  
  try {
    // Gọi API để lưu vào MongoDB
    const response = await fetch("/api/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(questionData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Không thể lưu câu hỏi');
    }
    
    const result = await response.json();
    console.log("Đã lưu câu hỏi vào MongoDB:", result);
    return result;
  } catch (error) {
    console.error("Lỗi khi lưu câu hỏi:", error);
    throw error;
  }
}

/**
 * Hàm để lưu câu trả lời từ tab Sale vào MongoDB 
 * 
 * @param question Nội dung câu hỏi
 * @param answer Nội dung câu trả lời
 * @param keyword Từ khóa
 * @param images Mảng URL hình ảnh
 * @returns Dữ liệu đã lưu
 */
export async function saveSaleAnswerToMongoDB(
  question: string,
  answer: string,
  keyword: string,
  images: string[]
) {
  // Định dạng dữ liệu theo cấu trúc Question
  const questionData = {
    question: question,
    keyword: keyword.split(",").map(k => k.trim()).filter(k => k),
    answer: answer,
    images: images,
    createdAt: new Date().toISOString(),
    source: "sale"
  };
  
  try {
    // Gọi API để lưu vào MongoDB
    const response = await fetch("/api/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(questionData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Không thể lưu câu trả lời');
    }
    
    const result = await response.json();
    console.log("Đã lưu câu trả lời vào MongoDB:", result);
    return result;
  } catch (error) {
    console.error("Lỗi khi lưu câu trả lời:", error);
    throw error;
  }
} 