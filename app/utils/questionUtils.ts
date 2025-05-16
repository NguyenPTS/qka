// Xu1eed lu00fd cu00e2u hu1ecfi vu00e0 lu01b0u vu00e0o MongoDB

export const saveSaleQuestionToMongoDB = async (questionText: string, keywordArr: string[], answerText: string, imageUrlArr: string[]) => {
  console.log('Starting saveSaleQuestionToMongoDB with:', { 
    question: questionText?.substring(0, 30) + '...',
    keywordCount: keywordArr?.length,
    answerLength: answerText?.length,
    imageCount: imageUrlArr?.length 
  });
  
  try {
    // Không sử dụng 'pending' làm từ khóa mặc định
    const finalKeywords = keywordArr?.length > 0 ? keywordArr : [];
    
    // Ensure answer has at least a space to pass validation
    const finalAnswer = answerText?.trim() ? answerText : ' ';
    
    // Determine status based on answer
    const status = answerText?.trim() ? 'answered' : 'pending';
    
    // Cấu trúc dữ liệu giống với Question
    const questionData = {
      question: questionText,
      keyword: finalKeywords,
      answer: finalAnswer,
      images: imageUrlArr || [],
      createdAt: new Date().toISOString(),
      source: "sale", // Đánh dấu nguồn
      status: status // Đảm bảo luôn có status
    };
    
    console.log('Preparing to save question data:', {
      questionLength: questionData.question?.length,
      keywordCount: questionData.keyword?.length,
      answerLength: questionData.answer?.length,
      imageCount: questionData.images?.length,
      createdAt: questionData.createdAt,
      source: questionData.source,
      status: questionData.status
    });
    
    // Gọi API
    console.log('Sending POST request to /api/questions');
    const response = await fetch("/api/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(questionData),
    });
    
    console.log('POST response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from API:', errorData);
      throw new Error(errorData.message || errorData.error || 'Lỗi khi lưu câu hỏi');
    }
    
    const result = await response.json();
    console.log("Đã lưu vào MongoDB thành công, ID:", result._id);
    return result;
  } catch (error) {
    console.error("Lỗi chi tiết khi lưu vào MongoDB:", error instanceof Error ? {
      message: error.message,
      stack: error.stack
    } : error);
    throw error;
  }
};

// Định nghĩa kiểu dữ liệu cho question
interface QuestionResponse {
  _id: string;
  question: string;
  answer: string;
  keyword: string[];
  images?: string[];
  status?: string;
  createdAt?: string;
  source?: string;
}

// Lu01b0u cu00e2u tru1ea3 lu1eddi vu00e0o MongoDB
export const saveSaleAnswerToMongoDB = async (questionId: string, answer: string, keyword: string, imageUrls: Array<{ id: string; url: string }>): Promise<QuestionResponse> => {
  console.log('Starting saveSaleAnswerToMongoDB with:', { 
    questionId,
    answerLength: answer?.length,
    keyword: keyword?.substring(0, 30),
    imageCount: imageUrls?.length 
  });
  
  try {
    // Kiểm tra xem câu hỏi này đã được lưu vào MongoDB và có _id chưa
    if (questionId) {
      // Nếu đã có _id, cập nhật câu hỏi
      console.log(`Updating question with ID: ${questionId}`);
      
      const updateData = {
        answer: answer,
        keyword: keyword.split(",").map(k => k.trim()).filter(k => k),
        images: imageUrls.map(img => img.url),
        source: "sale",
        status: 'answered' // Set status to answered when saving an answer
      };
      
      console.log('Update data:', {
        answerLength: updateData.answer?.length,
        keywordCount: updateData.keyword?.length,
        imageCount: updateData.images?.length,
        source: updateData.source,
        status: updateData.status
      });
      
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      
      console.log('PUT response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response from API:', errorData);
        throw new Error(errorData.message || errorData.error || 'Không thể cập nhật câu hỏi');
      }
      
      const result = await response.json();
      console.log("Đã cập nhật câu hỏi trong MongoDB thành công:", {
        id: result._id,
        status: result.status,
        answer: result.answer?.substring(0, 20) + '...' 
      });
      
      return result;
    }
    
    console.error("Không tìm thấy ID câu hỏi để cập nhật");
    throw new Error("Không tìm thấy ID câu hỏi để cập nhật");
  } catch (error) {
    console.error("Lỗi chi tiết khi lưu câu trả lời vào MongoDB:", error instanceof Error ? {
      message: error.message,
      stack: error.stack
    } : error);
    throw error;
  }
}; 