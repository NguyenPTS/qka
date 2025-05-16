"use client";

import { useState, useEffect, useCallback } from "react";
import React from "react";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  Tabs as ShadcnTabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Label,
  Textarea,
  Button,
  Input
} from "../components/ui";
import {
  ImageIcon,
  PlusCircle,
  Trash2,
  Edit,
  RefreshCw,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ArrowUp,
  ExternalLink,
  Edit3,
  X,
  ArrowUpDown,
  ArrowDown
} from "lucide-react";
import Image from 'next/image';
import type { StaticImageData } from 'next/image';
import { saveSaleQuestionToMongoDB, saveSaleAnswerToMongoDB } from "./utils/questionUtils";
import { getImageUrl } from './utils/helpers';

interface Question {
  _id?: string;
  question: string;
  keyword: string | string[];
  answer: string;
  images?: Array<string | { id: string; url: string }>;
  createdAt?: string;
  status?: 'pending' | 'answered' | 'done';
  __v?: number;
}

interface CrudTableProps {
  crudQuestions: Question[];
  handleCrudEdit: (q: Question) => void;
  handleCrudDelete: (id: string) => void;
}

interface SaleQuestion {
  id: string;
  _id?: string;  // Thêm _id optional cho MongoDB
  text: string;
  keyword?: string;
  images: Array<{ id: string; url: string; }>;
  status: 'pending' | 'answered' | 'done';
  createdAt: Date;
  answer?: string;
}

const uploadToWordPress = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Gửi file qua API của chúng ta
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Upload failed');
    }
    
    const data = await response.json();
    return data.url; // URL của ảnh từ API trả về
  } catch (error) {
    console.error('Error uploading to WordPress:', error);
    throw error;
  }
};

const CrudTable = React.memo(function CrudTable({ 
  crudQuestions, 
  handleCrudEdit, 
  handleCrudDelete,
  handleSortChange,
  getSortIcon
}: CrudTableProps & {
  handleSortChange: (field: string) => void;
  getSortIcon: (field: string) => React.ReactNode;
}) {
  // Hàm kiểm tra và xử lý URL ảnh
  const getImageUrl = (url: string | undefined): string | null => {
    if (!url) {
      console.log('URL is empty');
      return null;
    }
    
    console.log('Original image URL:', url);
    try {
    // Nếu là blob URL, bỏ qua không hiển thị
    if (url.startsWith('blob:')) {
      console.log('URL is blob:', url);
      return null;
    }

      // Nếu URL đã là URL đầy đủ, trả về nguyên bản
      if (url.match(/^https?:\/\//)) {
        console.log('Using original URL:', url);
        return url;
      }

      // Nếu URL bắt đầu bằng /wp-content, thêm domain
      if (url.startsWith('/wp-content')) {
        const fullUrl = `https://wordpress.pharmatech.vn${url}`;
        console.log('Converted to full URL:', fullUrl);
        return fullUrl;
      }

      // Nếu URL không có schema, thêm domain
      const baseUrl = 'https://wordpress.pharmatech.vn';
      const fullUrl = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
      console.log('Converted to full URL:', fullUrl);
      return fullUrl;
    } catch (error) {
      console.error('Error processing image URL:', error);
      return null;
    }
  };

  // Log toàn bộ dữ liệu câu hỏi để debug
  console.log('Questions data:', crudQuestions);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="min-w-full divide-y divide-gray-200">
        <div className="bg-gray-50">
          <div className="grid grid-cols-12 gap-4 px-6 py-3">
            <button 
              onClick={() => handleSortChange("question")}
              className="col-span-3 flex items-center gap-2 hover:text-blue-600 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Câu hỏi {getSortIcon("question")}
            </button>
            <button 
              onClick={() => handleSortChange("keyword")}
              className="col-span-2 flex items-center gap-2 hover:text-blue-600 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Từ khóa {getSortIcon("keyword")}
            </button>
            <button 
              onClick={() => handleSortChange("answer")}
              className="col-span-5 flex items-center gap-2 hover:text-blue-600 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Câu trả lời {getSortIcon("answer")}
            </button>
            <div className="col-span-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thao tác
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {crudQuestions.map((q) => {
            console.log('Processing question:', q._id);
            console.log('Images for question:', q.images);
            
            return (
              <div key={q._id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50">
                <div className="col-span-3">
                  <p className="text-sm text-gray-900">{q.question}</p>
                </div>
                <div className="col-span-2">
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(q.keyword) ? q.keyword.map((k, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {k}
                      </span>
                    )) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {q.keyword}
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-span-5">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{q.answer}</p>
                    {q.images && q.images.length > 0 && (
                      <div className="mt-2">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Hình ảnh đính kèm:</h3>
                        <div className="grid grid-cols-3 gap-4">
                          {q.images.map((image, index) => {
                            const imageUrl = typeof image === 'string' ? image : image.url;
                            const fullImageUrl = getImageUrl(imageUrl);
                            if (!fullImageUrl) return null;
                            
                            return (
                              <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm">
                                <Image
                                  src={fullImageUrl}
                                  alt={`Answer image ${index + 1}`}
                                  width={300}
                                  height={200}
                                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                  onError={(e) => {
                                    console.error(`Error loading image ${index + 1}:`, fullImageUrl);
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity">
                                  <a
                                    href={fullImageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                  >
                                    <span className="p-2 bg-white rounded-full">
                                      <ExternalLink size={16} className="text-gray-900" />
                                    </span>
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {q.createdAt && (
                      <p className="text-xs text-gray-500">
                        Ngày tạo: {new Date(q.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => handleCrudEdit(q)}
                    className="inline-flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Sửa"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => q._id && handleCrudDelete(q._id)}
                    className="inline-flex items-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa"
                    disabled={!q._id}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {crudQuestions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Không có câu hỏi nào
        </div>
      )}
    </div>
  );
});

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed right-6 bottom-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
      }`}
      aria-label="Lên đầu trang"
    >
      <ArrowUp className="h-6 w-6" />
    </button>
  );
};

export default function Home() {
  // States
  const [tab, setTab] = useState('0');
  const [prevTab, setPrevTab] = useState('0');
  const [question, setQuestion] = useState("");
  const [keyword, setKeyword] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);
  
  // Add management states
  const [crudQuestions, setCrudQuestions] = useState<Question[]>([]);
  const [crudTotal, setCrudTotal] = useState(0);
  const [crudPage, setCrudPage] = useState(1);
  const crudPageSize = 10;
  const [form, setForm] = useState({ question: "", keyword: "", answer: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pendingSortBy, setPendingSortBy] = useState<'createdAt' | 'updatedAt'>('createdAt');
  const [pendingSortOrder, setPendingSortOrder] = useState<'asc' | 'desc'>(sortOrder);
  const [isLocked, setIsLocked] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [subTab, setSubTab] = useState('pending');
  const [newQuestionImages, setNewQuestionImages] = useState<File[]>([]);
  const [searchQuestion, setSearchQuestion] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Add sale states
  const [saleNewQuestion, setSaleNewQuestion] = useState("");
  const [saleSelectedImages, setSaleSelectedImages] = useState<File[]>([]);
  const [saleImagePreviewUrls, setSaleImagePreviewUrls] = useState<string[]>([]);
  const [saleQuestions, setSaleQuestions] = useState<SaleQuestion[]>([]);
  const [saleAnswers, setSaleAnswers] = useState<Record<string, string>>({});
  const [saleCurrentTab, setSaleCurrentTab] = useState<'pending' | 'answered'>("pending");
  const [questionImages, setQuestionImages] = useState<Record<string, File[]>>({});
  const [loadingSaleQuestions, setLoadingSaleQuestions] = useState(false);

  const [editImages, setEditImages] = useState<File[]>([]);
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);

  // Thêm state để lưu trữ keyword khi trả lời
  const [saleAnswerKeywords, setSaleAnswerKeywords] = useState<Record<string, string>>({});

  // Add function to load sale questions from database
  const fetchSaleQuestions = useCallback(async () => {
    try {
      setLoadingSaleQuestions(true);
      setError("");
      
      const response = await fetch(`/api/questions?source=sale&sortBy=createdAt&sortOrder=desc`);
      
      if (!response.ok) {
        throw new Error('Không thể tải câu hỏi từ cơ sở dữ liệu');
      }
      
      const data = await response.json();
      
      if (data.success && data.data && Array.isArray(data.data.questions)) {
        // Log một số câu hỏi đầu tiên để debug
        console.log('Dữ liệu câu hỏi từ database:', data.data.questions.slice(0, 3).map((q: any) => ({
          id: q._id,
          status: q.status,
          answer: q.answer?.substring(0, 20),
          source: q.source,
          hasStatusField: q.hasOwnProperty('status')
        })));
        
        // Convert the database questions to SaleQuestion format
        const saleQuestionsFromDB = data.data.questions.map((q: any) => {
          // Xác định status một cách rõ ràng
          let questionStatus = q.status;
          
          // Nếu không có status hoặc status không hợp lệ, xác định lại dựa trên answer
          if (!questionStatus || !['pending', 'answered', 'done'].includes(questionStatus)) {
            questionStatus = (q.answer && q.answer.trim() !== '' && q.answer.trim() !== ' ') 
              ? 'answered' 
              : 'pending';
          }
          
          console.log(`Xử lý câu hỏi ${q._id}: status=${questionStatus}, có answer=${Boolean(q.answer)}`);
          
          return {
            id: q._id,
            _id: q._id,
            text: q.question,
            keyword: Array.isArray(q.keyword) ? q.keyword.join(', ') : q.keyword,
            images: Array.isArray(q.images) ? q.images.map((url: string) => ({ id: `img-${Math.random()}`, url })) : [],
            status: questionStatus,
            createdAt: new Date(q.createdAt || Date.now()),
            answer: q.answer || undefined
          };
        });
        
        setSaleQuestions(saleQuestionsFromDB);
        console.log('Loaded sale questions:', saleQuestionsFromDB.length);
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Định dạng phản hồi không hợp lệ');
      }
    } catch (error) {
      console.error('Error fetching sale questions:', error);
      setErrorMsg(error instanceof Error ? error.message : 'Lỗi khi tải câu hỏi từ sale');
    } finally {
      setLoadingSaleQuestions(false);
    }
  }, []);

  // Load sale questions when tab changes to sale tab
  useEffect(() => {
    if (tab === "2") {
      fetchSaleQuestions();
    }
  }, [tab, fetchSaleQuestions]);

  const handleQuestionSubmit = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    setHasSearched(true);
    setSelectedKeywords([]);
    setQuestions([]);
    try {
      console.log('Submitting question for keyword search:', question);
      const response = await fetch(
        `/api/questions/keyword?question=${encodeURIComponent(question)}`
      );
      
      console.log('Keyword API response status:', response.status);
      
      const data = await response.json();
      console.log('Keyword API response data:', data);
      
      if (response.ok) {
        if (Array.isArray(data) && data.length > 0) {
          console.log(`Found ${data.length} keywords`);
        setKeyword(data);
      } else {
          console.log('No keywords found');
          setKeyword([]);
        }
      } else {
        console.error('Keyword API error:', data.error || 'Unknown error');
        setError(data.error || "Failed to fetch keywords");
      }
    } catch (error) {
      console.error("Failed to connect to the server:", error);
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordToggle = async (keyword: string) => {
    setLoading(true);
    setError("");
    try {
      const newSelectedKeywords = selectedKeywords.includes(keyword)
        ? selectedKeywords.filter((k) => k !== keyword)
        : [...selectedKeywords, keyword];
      setSelectedKeywords(newSelectedKeywords);
      if (newSelectedKeywords.length === 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }
      const keywordsParam = newSelectedKeywords
        .map((k) => encodeURIComponent(k))
        .join(",");
      console.log("Tìm kiếm với từ khóa:", newSelectedKeywords);
      const response = await fetch(
        `/api/questions/search?keywords=${keywordsParam}`
      );
      const data = await response.json();
      console.log("Kết quả tìm kiếm từ API:", {
        total: data.length, 
        firstFew: data.slice(0, 3).map((q: Question) => ({
          id: q._id,
          question: q.question.substring(0, 30) + "...",
          hasAnswer: Boolean(q.answer),
          status: q.status,
          keywords: Array.isArray(q.keyword) ? q.keyword : [q.keyword]
        }))
      });
      
      if (response.ok) {
        // Không cần lọc theo status nữa vì API đã đảm bảo chỉ trả về câu hỏi có câu trả lời
        setQuestions(data);
        if (data.length === 0) {
          console.log("Không tìm thấy câu hỏi phù hợp với từ khóa:", newSelectedKeywords);
        }
      } else {
        setError(data.error || "Failed to fetch questions");
      }
    } catch (error) {
      console.error("Lỗi khi tìm kiếm:", error);
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuestion("");
    setKeyword([]);
    setSelectedKeywords([]);
    setQuestions([]);
    setError("");
    setHasSearched(false);
  };

  // Add management functions
  const fetchCrudQuestions = useCallback(async (page = 1, sortByParam = sortBy, sortOrderParam = sortOrder) => {
    let retries = 3;
    while (retries > 0) {
      try {
        const response = await fetch(
          `/api/questions?page=${page}&limit=10&sortBy=${sortByParam}&sortOrder=${sortOrderParam}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch questions');
        }
        
        const data = await response.json();
        console.log('API Response:', data);

        if (!data.success || !data.data || !Array.isArray(data.data.questions)) {
          console.error('Invalid response format:', data);
          throw new Error('Invalid response format');
        }
        
        // Kiểm tra và cập nhật state chỉ khi có dữ liệu hợp lệ
        if (data.data.total !== undefined && typeof data.data.total === 'number') {
          setCrudTotal(data.data.total);
          // Đảm bảo trang hiện tại không vượt quá tổng số trang
          const maxPage = Math.ceil(data.data.total / 10);
          const validPage = Math.min(page, maxPage);
          if (validPage !== page) {
            // Nếu trang hiện tại không hợp lệ, tự động chuyển về trang cuối
            setCrudPage(validPage);
            if (validPage < page) {
              // Nếu đang ở trang lớn hơn trang cuối, fetch lại dữ liệu
              fetchCrudQuestions(validPage, sortByParam, sortOrderParam);
              return;
            }
          } else {
        setCrudPage(page);
          }
        }
        
        setCrudQuestions(data.data.questions);
        return;
      } catch (error) {
        console.error('Error fetching questions:', error);
        retries--;
        if (retries === 0) {
          setErrorMsg("Có lỗi khi tải danh sách câu hỏi! Vui lòng thử lại sau.");
          // Reset states khi có lỗi
          setCrudQuestions([]);
          setCrudTotal(0);
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    if (tab === "1" && !isLocked) {
      fetchCrudQuestions(1, sortBy, sortOrder);
    }
  }, [tab, isLocked, sortBy, sortOrder, fetchCrudQuestions]);

  const handleSortChange = useCallback((field: string) => {
    if (sortBy === field) {
      // If clicking the same field, toggle order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // If clicking a new field, set it as sortBy and default to desc
      setSortBy(field);
      setSortOrder("desc");
    }
  }, [sortBy, sortOrder]);

  const getSortIcon = useCallback((field: string) => {
    if (sortBy !== field) return <ArrowUpDown size={16} className="text-gray-400" />;
    return sortOrder === "asc" ? 
      <ArrowUp size={16} className="text-blue-600" /> : 
      <ArrowDown size={16} className="text-blue-600" />;
  }, [sortBy, sortOrder]);

  const handleCrudChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => 
    setForm(f => ({ ...f, [e.target.name]: e.target.value })), []);

  const handleCrudTextAreaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => 
    setForm(f => ({ ...f, [e.target.name]: e.target.value })), []);

  const handleNewQuestionImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewQuestionImages((prev) => [...prev, ...files]);
  };

  const removeNewQuestionImage = (index: number) => {
    setNewQuestionImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCrudSubmit = async () => {
    try {
      // Validate form
      if (!form.question.trim()) {
        setErrorMsg("Vui lòng nhập câu hỏi!");
        return;
      }
      if (!form.keyword.trim()) {
        setErrorMsg("Vui lòng nhập từ khóa!");
        return;
      }
      if (!form.answer.trim()) {
        setErrorMsg("Vui lòng nhập câu trả lời!");
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);
      setErrorMsg("");

      // Handle images
      let imageUrls: string[] = [];
      
      if (editingId) {
        // For editing: use existing images that haven't been removed
        imageUrls = editImagePreviews.filter(url => !url.startsWith('blob:'));
        
        // Upload new images from editImages
        if (editImages.length > 0) {
          for (const file of editImages) {
            try {
              const formData = new FormData();
              formData.append('file', file);
              
              const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData
              });

              if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(`Lỗi upload ảnh ${file.name}: ${errorData.message || 'Upload failed'}`);
              }

              const data = await uploadResponse.json();
              if (data.url) {
                imageUrls.push(data.url);
              } else {
                throw new Error(`Không nhận được URL ảnh từ server cho file ${file.name}`);
              }
            } catch (error: any) {
              console.error(`Error uploading image ${file.name}:`, error);
              const continueUpload = window.confirm(`${error.message || `Lỗi khi upload ảnh ${file.name}`}. Tiếp tục với các ảnh khác?`);
              if (!continueUpload) {
                setIsSubmitting(false);
                return;
              }
            }
          }
        }
      } else {
        // For new questions: upload images from newQuestionImages
        if (newQuestionImages.length > 0) {
          for (const file of newQuestionImages) {
            try {
              const formData = new FormData();
              formData.append('file', file);
              
              const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData
              });

              if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(`Lỗi upload ảnh ${file.name}: ${errorData.message || 'Upload failed'}`);
              }

              const data = await uploadResponse.json();
              if (data.url) {
                imageUrls.push(data.url);
              } else {
                throw new Error(`Không nhận được URL ảnh từ server cho file ${file.name}`);
              }
            } catch (error: any) {
              console.error(`Error uploading image ${file.name}:`, error);
              const continueUpload = window.confirm(`${error.message || `Lỗi khi upload ảnh ${file.name}`}. Tiếp tục với các ảnh khác?`);
              if (!continueUpload) {
                setIsSubmitting(false);
                return;
              }
            }
          }
        }
      }

      if (editingId) {
        const response = await fetch(`/api/questions/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            keyword: form.keyword.split(",").map((k) => k.trim()).filter(k => k),
            images: imageUrls,
            status: 'answered'
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Không thể cập nhật câu hỏi');
        }
        
        await fetchCrudQuestions(crudPage, sortBy, sortOrder);
        setEditingId(null);
        setEditOpen(false);
        setForm({ question: "", keyword: "", answer: "" });
        setEditImages([]);
        setEditImagePreviews([]);
        setSuccessMsg("Cập nhật câu hỏi thành công!");
      } else {
        const questionData = {
          ...form,
          keyword: form.keyword.split(",").map((k) => k.trim()).filter(k => k),
          images: imageUrls,
          status: 'answered', // Set status to answered for new questions
          createdAt: new Date().toISOString()
        };

        const response = await fetch("/api/questions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(questionData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Không thể tạo câu hỏi mới');
        }

        await fetchCrudQuestions(crudPage, sortBy, sortOrder);
        setForm({ question: "", keyword: "", answer: "" });
        setNewQuestionImages([]);
        setSuccessMsg("Thêm câu hỏi thành công!");
      }
    } catch (error: any) {
      console.error("Error submitting question:", error);
      setSubmitError(error.message);
      setErrorMsg(error.message || "Có lỗi xảy ra khi xử lý yêu cầu!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEditImages((prev) => [...prev, ...files]);
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setEditImagePreviews((prev) => [...prev, ...newPreviewUrls]);
  };

  const removeEditImage = (index: number) => {
    const url = editImagePreviews[index];
    // If it's a blob URL, we need to revoke it
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      // Also remove the corresponding File object
      setEditImages((prev) => prev.filter((_, i) => i !== editImages.length - (editImagePreviews.length - index)));
    }
    setEditImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCrudEdit = useCallback((q: Question) => {
    if (!q._id) {
      console.error('Cannot edit question: ID is undefined');
      setErrorMsg("Không thể sửa câu hỏi: ID không tồn tại!");
      return;
    }

    setForm({
      question: q.question,
      keyword: Array.isArray(q.keyword) ? q.keyword.join(", ") : q.keyword,
      answer: q.answer,
    });
    setEditingId(q._id);
    setEditOpen(true);
    
    // Convert complex image objects to string URLs
    if (q.images && q.images.length > 0) {
      const imageUrls = q.images.map(img => typeof img === 'string' ? img : img.url);
      setEditImagePreviews(imageUrls);
    }
  }, []);

  const handleEditClose = () => {
    setEditOpen(false);
    setEditingId(null);
    setForm({ question: "", keyword: "", answer: "" });
    setEditImages([]);
    setEditImagePreviews([]);
  };

  const handleCrudDelete = useCallback((id?: string) => {
    if (!id) {
      console.error('Cannot delete question: ID is undefined');
      setErrorMsg("Không thể xóa câu hỏi: ID không tồn tại!");
      return;
    }

    if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      fetch(`/api/questions/${id}`, { 
        method: "DELETE" 
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to delete');
        fetchCrudQuestions(crudPage, sortBy, sortOrder);
        setSuccessMsg("Xóa câu hỏi thành công!");
      })
      .catch(error => {
        console.error('Error deleting question:', error);
        setErrorMsg("Có lỗi xảy ra khi xóa câu hỏi!");
      });
    }
  }, [crudPage, sortBy, sortOrder, fetchCrudQuestions]);

  const handleTabChange = (_: any, value: string) => {
    setPrevTab(tab);
    setTab(value);
    if (value === "1" && isLocked) {
      setShowPasswordDialog(true);
    } else if (value === "2") {
      // Refresh sales questions when tab is selected
      fetchSaleQuestions();
    }
  };

  useEffect(() => {
    if (tab === "1" && isLocked && !showPasswordDialog) {
      setShowPasswordDialog(true);
    }
  }, [tab, isLocked, showPasswordDialog]);

  // Add sale functions
  const handleSaleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSaleSelectedImages((prev) => [...prev, ...files]);
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setSaleImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  const removeSaleImage = (index: number) => {
    setSaleSelectedImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(saleImagePreviewUrls[index]);
    setSaleImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Sửa hàm addSaleQuestion
  const addSaleQuestion = async () => {
    if (!saleNewQuestion.trim()) return;
    
    console.log('Starting to add sale question...');
    setIsSubmitting(true);
    try {
      // Tạo câu hỏi mới
      const newQuestionItem = {
      id: `q-${Date.now()}`,
      text: saleNewQuestion,
        images: [],
      status: "pending" as const,
      createdAt: new Date(),
    };
      
      // Lưu vào state local
    setSaleQuestions((prev) => [newQuestionItem, ...prev]);
      
      // Log trạng thái khi tạo câu hỏi mới
      console.log('Creating new sale question with status: pending');
      
      // Lưu vào MongoDB - Không sử dụng từ khóa mặc định và đảm bảo status là pending
      await saveSaleQuestionToMongoDB(
        saleNewQuestion, // câu hỏi
        [], // từ khóa (trống)
        " ", // câu trả lời - thêm khoảng trắng để tránh lỗi validation
        [] // hình ảnh (trống)
      );
      
      // Reset form
    setSaleNewQuestion("");
    setSaleSelectedImages([]);
    setSaleImagePreviewUrls([]);
      
      // Refresh questions list from database
      await fetchSaleQuestions();
      
      setSuccessMsg("Thêm câu hỏi thành công!");
    } catch (error: any) {
      console.error("Lỗi:", error);
      setErrorMsg(error.message || "Có lỗi xảy ra khi tạo câu hỏi mới");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sửa hàm answerSaleQuestion
  const answerSaleQuestion = async (questionId: string) => {
    try {
      const answer = saleAnswers[questionId];
      if (!answer?.trim()) return;

      // Lấy câu hỏi từ state
      const question = saleQuestions.find(q => q.id === questionId);
      if (!question) return;
      
      // Lấy keyword từ input hoặc sử dụng giá trị hiện tại
      const keyword = saleAnswerKeywords[questionId]?.trim() || question.keyword || "";
      
      // Xử lý ảnh
      const imageUrls: Array<{ id: string; url: string }> = [];

      // Thêm logic upload ảnh nếu cần
      if (questionImages[questionId] && questionImages[questionId].length > 0) {
        for (const file of questionImages[questionId]) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`Lỗi upload ảnh: ${errorData.message || 'Upload failed'}`);
            }

            const data = await response.json();
            if (data.url) {
                imageUrls.push({
                id: `img-${Date.now()}-${Math.random()}`, 
                url: data.url 
              });
            } else {
              throw new Error(`Không nhận được URL ảnh từ server`);
            }
          } catch (error: any) {
            console.error(`Error uploading image:`, error);
            const continueUpload = window.confirm(`${error.message || `Lỗi khi upload ảnh`}. Tiếp tục với các ảnh khác?`);
              if (!continueUpload) {
                return;
              }
            }
          }
        }
      
      // Kiểm tra và log ID câu hỏi
      console.log('Chuẩn bị cập nhật câu hỏi với ID:', question._id);
      
      // Lưu vào MongoDB
      try {
        // Kiểm tra xem có _id không, nếu không thì hiển thị thông báo lỗi
        if (!question._id) {
          throw new Error("Không tìm thấy _id của câu hỏi trong MongoDB. Không thể cập nhật.");
        }
        
        // Chuẩn bị dữ liệu cập nhật
        const updateData = {
          answer: answer,
          keyword: keyword.split(",").map(k => k.trim()).filter(k => k),
          images: imageUrls.map(img => img.url),
          source: "sale",
          status: 'answered' as const
        };
        
        console.log('Đang gửi dữ liệu cập nhật từ tab đang chờ:', {
          id: question._id,
          answer: answer.substring(0, 30),
          keywordCount: updateData.keyword.length,
          imagesCount: updateData.images.length,
          status: updateData.status,
          source: updateData.source
        });
        
        // Gọi API trực tiếp để cập nhật câu hỏi
        const response = await fetch(`/api/questions/${question._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });
        
        console.log('Response status from API:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response from API:', errorData);
          throw new Error(errorData.message || errorData.error || 'Không thể cập nhật câu hỏi');
        }
        
        const result = await response.json();
        console.log("Kết quả cập nhật từ API:", {
          id: result._id,
          status: result.status,
          answer: result.answer?.substring(0, 20) + '...'
        });
        
        // Cập nhật state local
      setSaleQuestions(prev => 
        prev.map(q => 
          q.id === questionId 
              ? { 
                  ...q, 
                  answer, 
                  keyword, 
                  images: imageUrls, 
                  status: 'answered' 
                } 
            : q
        )
      );

      } catch (error) {
        console.error("Lỗi khi lưu vào MongoDB:", error);
        const continueAnyway = window.confirm("Có lỗi khi lưu vào cơ sở dữ liệu. Bạn vẫn muốn lưu vào danh sách local?");
        if (!continueAnyway) return;
        
        // Nếu có lỗi với API nhưng người dùng vẫn muốn lưu local
        setSaleQuestions(prev => 
          prev.map(q => 
            q.id === questionId 
              ? { ...q, answer, keyword, images: imageUrls, status: 'answered' } 
              : q
          )
        );
      }
      
      // Reset state
      setSaleAnswers(prev => {
        const newAnswers = { ...prev };
        delete newAnswers[questionId];
        return newAnswers;
      });
      
      setSaleAnswerKeywords(prev => {
        const newKeywords = { ...prev };
        delete newKeywords[questionId];
        return newKeywords;
      });
      
      setQuestionImages(prev => {
        const newImages = { ...prev };
        delete newImages[questionId];
        return newImages;
      });

      // Refresh the list
      await fetchSaleQuestions();

      alert("Đã lưu câu trả lời thành công!");
    } catch (error) {
      console.error('Lỗi khi trả lời:', error);
      alert(`Có lỗi xảy ra: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  };

  // Utility functions for Sale Questions
  const handleSaleAnswerChange = (questionId: string, value: string) => {
    setSaleAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSaleAnswerKeywordChange = (questionId: string, value: string) => {
    setSaleAnswerKeywords((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, questionId: string) => {
    const files = Array.from(e.target.files || []);
    setQuestionImages(prev => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), ...files]
    }));
  };

  const removeImage = (questionId: string, index: number) => {
    setQuestionImages(prev => ({
      ...prev,
      [questionId]: prev[questionId].filter((_, i) => i !== index)
    }));
  };

  const deleteSaleQuestion = async (questionId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      try {
        // Lấy câu hỏi từ state
        const question = saleQuestions.find(q => q.id === questionId);
        if (!question || !question._id) {
          console.error('Không tìm thấy ID câu hỏi để xóa');
          return;
        }
        
        console.log('Đang xóa câu hỏi:', question._id);
        
        // Gọi API để xóa câu hỏi
        const response = await fetch(`/api/questions/${question._id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || 'Không thể xóa câu hỏi');
        }
        
        console.log('Đã xóa câu hỏi thành công:', question._id);
        
        // Cập nhật state local
    setSaleQuestions((prev) => prev.filter((q) => q.id !== questionId));
        
        // Hiển thị thông báo thành công
        setSuccessMsg("Đã xóa câu hỏi thành công!");
        
      } catch (error) {
        console.error('Lỗi khi xóa câu hỏi:', error);
        setErrorMsg("Có lỗi xảy ra khi xóa câu hỏi");
        
        // Cập nhật state local nếu API gặp lỗi
        setSaleQuestions((prev) => prev.filter((q) => q.id !== questionId));
      }
    }
  };

  const resetSaleToPending = async (questionId: string) => {
    try {
      // Lấy câu hỏi từ state
      const question = saleQuestions.find(q => q.id === questionId);
      if (!question || !question._id) {
        console.error('Không tìm thấy ID câu hỏi để cập nhật');
        return;
      }
      
      // Chuẩn bị dữ liệu cập nhật
      const updateData = {
        answer: '', // Xóa câu trả lời
        status: 'pending' as const
      };
      
      console.log('Đang reset câu hỏi về pending:', {
        id: question._id,
        status: updateData.status
      });
      
      // Gọi API để cập nhật trạng thái
      const response = await fetch(`/api/questions/${question._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Không thể cập nhật câu hỏi');
      }
      
      // Sau khi cập nhật thành công qua API, cập nhật state local
      setSaleQuestions((prev) => 
        prev.map((q) => (q.id === questionId ? { ...q, status: "pending", answer: undefined } : q))
      );
      
      // Refresh danh sách câu hỏi từ database
      await fetchSaleQuestions();
      
    } catch (error) {
      console.error('Lỗi khi reset câu hỏi:', error);
      // Fallback to local update if API fails
      setSaleQuestions((prev) => 
        prev.map((q) => (q.id === questionId ? { ...q, status: "pending", answer: undefined } : q))
      );
    }
  };

  // Utility function to extract keywords array
  const getKeywordsArray = (keyword: string | string[]): string[] => {
    return Array.isArray(keyword) ? keyword : [keyword];
  };

  // Filter function for questions based on tab
  const getFilteredCrudQuestions = (tab: string, questions: Question[]) => {
    if (tab === 'pending') {
      return questions.filter(q => !q.answer || q.answer.trim() === '' || q.status === 'pending');
    } else if (tab === 'answered') {
      return questions.filter(q => q.status === 'answered');
    } else if (tab === 'all') {
      // Hiển thị tất cả câu hỏi đã trả lời (với status 'answered' hoặc 'done')
      // và không hiển thị các câu hỏi pending
      return questions.filter(q => q.status === 'answered' || q.status === 'done');
    } else {
      return questions;
    }
  };

  // Filter sale questions by current tab
  const saleFilteredQuestions = saleQuestions.filter((q) => {
    console.log(`Lọc câu hỏi ${q.id}, status=${q.status}, has answer=${Boolean(q.answer)}`);
    
    if (saleCurrentTab === 'pending') {
      // Trong tab "Đang chờ", chỉ hiển thị câu hỏi có status pending
      return q.status === 'pending';
    } else if (saleCurrentTab === 'answered') {
      // Trong tab "Đã trả lời", hiển thị tất cả câu hỏi đã có câu trả lời
      // Điều kiện: status là 'answered'/'done' HOẶC có câu trả lời hợp lệ
      return q.status === 'answered' || q.status === 'done' || 
        (q.answer && typeof q.answer === 'string' && q.answer.trim() !== '' && q.answer.trim() !== ' ');
    }
    
    // Mặc định không hiển thị nếu không thuộc tab nào
    return false;
  });

  // Sort function for questions
  const sortQuestions = (a: Question, b: Question, sortBy: string, sortOrder: 'asc' | 'desc') => {
    if (sortBy === 'createdAt') {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
    } else if (sortBy === 'question') {
      return sortOrder === 'desc' 
        ? b.question.localeCompare(a.question)
        : a.question.localeCompare(b.question);
    } else if (sortBy === 'keyword') {
      const aKeyword = Array.isArray(a.keyword) ? a.keyword.join(',') : a.keyword || '';
      const bKeyword = Array.isArray(b.keyword) ? b.keyword.join(',') : b.keyword || '';
      return sortOrder === 'desc' 
        ? bKeyword.localeCompare(aKeyword)
        : aKeyword.localeCompare(bKeyword);
    } else if (sortBy === 'answer') {
      return sortOrder === 'desc' 
        ? b.answer.localeCompare(a.answer)
        : a.answer.localeCompare(b.answer);
    } else {
      return 0;
    }
  };

  // Thêm hàm searchKeywordInDetail để tái sử dụng cho tất cả các tab
  const searchKeywordInDetail = (keyword: string | string[], searchText: string): boolean => {
    const keywords = Array.isArray(keyword) ? keyword : [keyword];
    return keywords.some(kw => {
      // So sánh chính xác từng từ khoá thay vì dùng includes
      // Xử lý trường hợp keyword là các từ khóa phân tách bởi dấu phẩy
      const searchTerms = searchText.trim().toLowerCase().split(',').map(term => term.trim());
      const kwLower = kw.toLowerCase().trim();
      
      // Kiểm tra từng từ khóa trong searchTerms
      return searchTerms.some(term => {
        // Nếu là so sánh chính xác
        if (term === kwLower) return true;
        // Hoặc nếu từ khóa chứa term
        if (kwLower.includes(term)) return true;
        // Hoặc nếu term chứa từ khóa
        if (term.includes(kwLower)) return true;
        return false;
      });
    });
  };

  // Thêm state mới để lưu kết quả tìm kiếm
  const [searchResults, setSearchResults] = useState<Question[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Thêm state cho tab pending
  const [pendingSearchResults, setPendingSearchResults] = useState<Question[]>([]);
  const [isPendingSearching, setIsPendingSearching] = useState(false);
  
  // Thêm state cho tab answered
  const [answeredSearchResults, setAnsweredSearchResults] = useState<Question[]>([]);
  const [isAnsweredSearching, setIsAnsweredSearching] = useState(false);

  // Thêm hàm mới để thực hiện tìm kiếm
  const handleSearch = useCallback(() => {
    if (!searchQuestion.trim() && !searchKeyword.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    // Hiện thị thông báo cho người dùng
    console.log('Đang tìm kiếm toàn bộ cơ sở dữ liệu...');
    
    // Tạo URL với tham số search để backend có thể lọc trực tiếp
    let apiUrl = `/api/questions?limit=10000&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    
    // Thêm tham số tìm kiếm vào URL
    if (searchQuestion.trim()) {
      apiUrl += `&searchQuestion=${encodeURIComponent(searchQuestion.trim())}`;
    }
    
    if (searchKeyword.trim()) {
      apiUrl += `&searchKeyword=${encodeURIComponent(searchKeyword.trim())}`;
    }
    
    // Thêm tham số status để chỉ lấy câu hỏi đã trả lời
    apiUrl += `&status=answered,done`;
    
    // Log URL API để debug
    console.log('Search API URL:', apiUrl);
    
    // Gọi API tìm kiếm
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success && data.data && Array.isArray(data.data.questions)) {
          console.log(`API trả về ${data.data.questions.length} câu hỏi tổng cộng.`);
          
          let filtered = data.data.questions;
          
          // Thực hiện lọc phụ trên client nếu cần (trong trường hợp backend không hỗ trợ lọc)
          // Lọc theo trạng thái (tương tự getFilteredCrudQuestions('all'))
          filtered = filtered.filter((q: Question) => q.status === 'answered' || q.status === 'done');
          
          // Lọc theo câu hỏi nếu có và backend không hỗ trợ
          if (searchQuestion.trim()) {
            filtered = filtered.filter((q: Question) => 
              q.question.toLowerCase().includes(searchQuestion.trim().toLowerCase())
            );
          }
          
          // Lọc theo từ khóa nếu có và backend không hỗ trợ
          if (searchKeyword.trim()) {
            filtered = filtered.filter((q: Question) => searchKeywordInDetail(q.keyword, searchKeyword));
          }
          
          // Sắp xếp kết quả
          filtered = [...filtered].sort((a, b) => sortQuestions(a, b, sortBy, sortOrder));
          
          // Cập nhật state với kết quả tìm kiếm
          setSearchResults(filtered);
          console.log(`Tìm thấy ${filtered.length} kết quả tìm kiếm phù hợp.`);
        } else {
          console.error('Invalid response format:', data);
          setSearchResults([]);
          setErrorMsg("Định dạng phản hồi không hợp lệ");
        }
      })
      .catch(error => {
        console.error("Lỗi khi tìm kiếm:", error);
        setErrorMsg("Có lỗi xảy ra khi tìm kiếm: " + error.message);
        setSearchResults([]);
      });
  }, [searchQuestion, searchKeyword, sortBy, sortOrder]);
  
  // Cập nhật hàm tìm kiếm cho tab "pending" tương tự
  const handlePendingSearch = useCallback(() => {
    if (!searchQuestion.trim() && !searchKeyword.trim()) {
      setIsPendingSearching(false);
      setPendingSearchResults([]);
      return;
    }
    
    setIsPendingSearching(true);
    console.log('Đang tìm kiếm toàn bộ cơ sở dữ liệu cho tab "pending"...');
    
    // Tạo URL với tham số search để backend có thể lọc trực tiếp
    let apiUrl = `/api/questions?limit=10000&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    
    // Thêm tham số tìm kiếm vào URL
    if (searchQuestion.trim()) {
      apiUrl += `&searchQuestion=${encodeURIComponent(searchQuestion.trim())}`;
    }
    
    if (searchKeyword.trim()) {
      apiUrl += `&searchKeyword=${encodeURIComponent(searchKeyword.trim())}`;
    }
    
    // Thêm tham số status để chỉ lấy câu hỏi "pending"
    apiUrl += `&status=pending`;
    
    // Log URL API để debug
    console.log('Pending Search API URL:', apiUrl);
    
    // Gọi API tìm kiếm
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success && data.data && Array.isArray(data.data.questions)) {
          console.log(`API trả về ${data.data.questions.length} câu hỏi pending tổng cộng.`);
          
          let filtered = data.data.questions;
          
          // Lọc bổ sung nếu cần
          filtered = filtered.filter((q: Question) => !q.answer || q.answer.trim() === '' || q.status === 'pending');
          
          // Nếu backend không hỗ trợ lọc theo câu hỏi, thực hiện trên client
          if (searchQuestion.trim()) {
            filtered = filtered.filter((q: Question) => 
              q.question.toLowerCase().includes(searchQuestion.trim().toLowerCase())
            );
          }
          
          // Nếu backend không hỗ trợ lọc theo từ khóa, thực hiện trên client
          if (searchKeyword.trim()) {
            filtered = filtered.filter((q: Question) => searchKeywordInDetail(q.keyword, searchKeyword));
          }
          
          // Sắp xếp kết quả
          filtered = [...filtered].sort((a, b) => sortQuestions(a, b, sortBy, sortOrder));
          
          // Cập nhật state với kết quả tìm kiếm
          setPendingSearchResults(filtered);
          console.log(`Tìm thấy ${filtered.length} kết quả tìm kiếm phù hợp trong tab pending.`);
        } else {
          console.error('Invalid pending response format:', data);
          setPendingSearchResults([]);
          setErrorMsg("Định dạng phản hồi không hợp lệ");
        }
      })
      .catch(error => {
        console.error("Lỗi khi tìm kiếm tab pending:", error);
        setErrorMsg("Có lỗi xảy ra khi tìm kiếm trong tab pending: " + error.message);
        setPendingSearchResults([]);
      });
  }, [searchQuestion, searchKeyword, sortBy, sortOrder]);

  // Cập nhật hàm tìm kiếm cho tab "answered" tương tự
  const handleAnsweredSearch = useCallback(() => {
    if (!searchQuestion.trim() && !searchKeyword.trim()) {
      setIsAnsweredSearching(false);
      setAnsweredSearchResults([]);
      return;
    }
    
    setIsAnsweredSearching(true);
    console.log('Đang tìm kiếm toàn bộ cơ sở dữ liệu cho tab "answered"...');
    
    // Tạo URL với tham số search để backend có thể lọc trực tiếp
    let apiUrl = `/api/questions?limit=10000&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    
    // Thêm tham số tìm kiếm vào URL
    if (searchQuestion.trim()) {
      apiUrl += `&searchQuestion=${encodeURIComponent(searchQuestion.trim())}`;
    }
    
    if (searchKeyword.trim()) {
      apiUrl += `&searchKeyword=${encodeURIComponent(searchKeyword.trim())}`;
    }
    
    // Thêm tham số status để chỉ lấy câu hỏi "answered"
    apiUrl += `&status=answered`;
    
    // Log URL API để debug
    console.log('Answered Search API URL:', apiUrl);
    
    // Gọi API tìm kiếm
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success && data.data && Array.isArray(data.data.questions)) {
          console.log(`API trả về ${data.data.questions.length} câu hỏi answered tổng cộng.`);
          
          let filtered = data.data.questions;
          
          // Lọc bổ sung nếu cần
          filtered = filtered.filter((q: Question) => q.status === 'answered');
          
          // Nếu backend không hỗ trợ lọc theo câu hỏi, thực hiện trên client
          if (searchQuestion.trim()) {
            filtered = filtered.filter((q: Question) => 
              q.question.toLowerCase().includes(searchQuestion.trim().toLowerCase())
            );
          }
          
          // Nếu backend không hỗ trợ lọc theo từ khóa, thực hiện trên client
          if (searchKeyword.trim()) {
            filtered = filtered.filter((q: Question) => searchKeywordInDetail(q.keyword, searchKeyword));
          }
          
          // Sắp xếp kết quả
          filtered = [...filtered].sort((a, b) => sortQuestions(a, b, sortBy, sortOrder));
          
          // Cập nhật state với kết quả tìm kiếm
          setAnsweredSearchResults(filtered);
          console.log(`Tìm thấy ${filtered.length} kết quả tìm kiếm phù hợp trong tab answered.`);
        } else {
          console.error('Invalid answered response format:', data);
          setAnsweredSearchResults([]);
          setErrorMsg("Định dạng phản hồi không hợp lệ");
        }
      })
      .catch(error => {
        console.error("Lỗi khi tìm kiếm tab answered:", error);
        setErrorMsg("Có lỗi xảy ra khi tìm kiếm trong tab answered: " + error.message);
        setAnsweredSearchResults([]);
      });
  }, [searchQuestion, searchKeyword, sortBy, sortOrder]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-center w-full min-h-screen bg-gray-50">
        <div className="w-full max-w-5xl px-4 py-8 bg-white rounded-2xl shadow-lg">
          <h1 className="text-3xl font-bold mb-8">Quản lý câu hỏi</h1>
          
          <ShadcnTabs value={tab} onValueChange={setTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="0">Tìm kiếm câu hỏi</TabsTrigger>
              <TabsTrigger value="1">Quản lý câu hỏi</TabsTrigger>
              <TabsTrigger value="2">Thêm câu hỏi bởi sale</TabsTrigger>
            </TabsList>

            <TabsContent value="0">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Tìm kiếm câu hỏi</h2>
                <span className="text-sm text-gray-500">Chỉ hiển thị câu hỏi đã được trả lời</span>
              </div>
              <div className="p-4 mb-4 bg-white rounded-lg">
                <input
                  type="text"
                  placeholder="Type your question and press Enter..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleQuestionSubmit()}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <div className="mt-2 flex gap-2">
                  <Button onClick={handleQuestionSubmit} disabled={loading}>
                    {loading ? "Searching..." : "Find Keywords"}
                  </Button>
                  <Button 
                    onClick={handleClear} 
                    disabled={loading || !hasSearched} 
                    className="border border-gray-300 bg-white text-blue-700 hover:bg-gray-100"
                  >
                    Clear
                  </Button>
                </div>
                <p className="mt-2 text-sm text-gray-500">Chỉ hiển thị những câu hỏi đã được trả lời.</p>
              </div>

              {error && (
                <div className="mb-2 text-red-500">{error}</div>
              )}

              {hasSearched && !loading && keyword.length === 0 && (
                <div className="mb-2 text-blue-500">
                  No keywords found for your question. Please try a different question.
                </div>
              )}

              {keyword.length > 0 && (
                <div className="p-4 mb-4 bg-white rounded-lg">
                  <h3 className="text-base font-bold mb-2">Related Keywords ({keyword.length}) - Selected: {selectedKeywords.length}</h3>
                  <div className="flex flex-wrap gap-2">
                    {keyword.map((kw) => (
                      <button
                        key={kw}
                        onClick={() => handleKeywordToggle(kw)}
                        className={`px-2 py-1 border ${selectedKeywords.includes(kw) ? 'border-blue-500' : 'border-gray-200'} rounded-md ${selectedKeywords.includes(kw) ? 'bg-blue-50' : ''}`}
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedKeywords.length > 0 && (
                <div className="p-4 mb-4 bg-white rounded-lg">
                  <h3 className="text-base font-bold mb-2">Selected Keywords:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedKeywords.map((kw) => (
                      <button
                        key={kw}
                        onClick={() => handleKeywordToggle(kw)}
                        className="px-2 py-1 border border-gray-200 rounded-md"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedKeywords.length > 0 && !loading && questions.length === 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mt-4">
                  <p className="text-blue-700">
                    Không tìm thấy câu hỏi nào với từ khóa: <strong>{selectedKeywords.join(", ")}</strong>
                  </p>
                  <p className="text-sm text-blue-600 mt-2">
                    Hãy thử từ khóa khác hoặc kiểm tra lại từ khóa của bạn.
                  </p>
                </div>
              )}

              {questions.length > 0 && (
                <div className="mt-4">
                  <div className="flex flex-col gap-4">
                    {questions?.map((question) => (
                      <div key={question._id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">{question.question}</h4>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {getKeywordsArray(question.keyword).map((k: string, i: number) => (
                                <button
                                  key={i}
                                  onClick={() => !selectedKeywords.includes(k) && handleKeywordToggle(k)}
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    selectedKeywords.includes(k)
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                  }`}
                                >
                                  {k}
                                </button>
                              ))}
                            </div>
                          </div>
                         
                          
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Câu trả lời:</h5>
                            <div className="text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-100">
                              {question.answer}
                            </div>
                          </div>

                          {question.images && question.images.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Hình ảnh đính kèm:</h5>
                              <div className="grid grid-cols-3 gap-4">
                                {question.images.map((image, index) => {
                                  const imageUrl = typeof image === 'string' ? image : image.url;
                                  const fullImageUrl = getImageUrl(imageUrl);
                                  if (!fullImageUrl) return null;
                                  
                                  return (
                                    <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm">
                                      <Image
                                        src={fullImageUrl}
                                        alt={`Answer image ${index + 1}`}
                                        width={300}
                                        height={200}
                                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                        onError={(e) => {
                                          console.error(`Error loading image ${index + 1}:`, fullImageUrl);
                                          const target = e.target as HTMLImageElement;
                                          target.onerror = null;
                                          target.style.display = 'none';
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity">
                                        <a
                                          href={fullImageUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                        >
                                          <span className="p-2 bg-white rounded-full">
                                            <ExternalLink size={16} className="text-gray-900" />
                                          </span>
                                        </a>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {question.createdAt && (
                            <div className="text-sm text-gray-500">
                              Ngày tạo: {new Date(question.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="text-center mt-2 text-gray-500">
                  Loading...
                </div>
              )}
            </TabsContent>

            <TabsContent value="1">
              {tab === "1" && isLocked && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-white p-8 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Nhập mật khẩu để truy cập</h2>
                    <input
                      type="password"
                      placeholder="Nhập mật khẩu"
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => {
                          setShowPasswordDialog(false);
                          setTab(prevTab.toString());
                          setPasswordInput("");
                          setPasswordError("");
                        }}
                        className="px-4 py-2 bg-gray-200 rounded-md"
                      >
                        Quay lại
                      </button>
                      <button
                        onClick={() => {
                          if (passwordInput === "ChiPhuong") {
                            setIsLocked(false);
                            setShowPasswordDialog(false);
                            setPasswordInput("");
                            setPasswordError("");
                          } else {
                            setPasswordError("Mật khẩu không đúng!");
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md"
                      >
                        Xác nhận
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {tab === "1" && !isLocked && (
                <>
                  <div className="flex justify-end mb-4">
                    {/* <button
                      onClick={async () => {
                        if (window.confirm('Quá trình này sẽ cập nhật trường status cho các câu hỏi cũ. Tiếp tục?')) {
                          try {
                            setLoading(true);
                            const response = await fetch('/api/questions/fix-status');
                            const data = await response.json();
                            if (data.success) {
                              setSuccessMsg(`Đã cập nhật ${data.totalFixed} câu hỏi thiếu trường status`);
                              // Tải lại danh sách câu hỏi
                              await fetchCrudQuestions(crudPage, sortBy, sortOrder);
                            } else {
                              setErrorMsg(data.error || 'Có lỗi xảy ra khi cập nhật trường status');
                            }
                          } catch (error) {
                            console.error('Error fixing status:', error);
                            setErrorMsg('Có lỗi xảy ra khi cập nhật trường status');
                          } finally {
                            setLoading(false);
                          }
                        }
                      }}
                      className="px-4 py-2 mr-2 bg-blue-600 text-white rounded-md"
                    >
                      Sửa trường Status
                    </button> */}
                    <button
                      onClick={() => setIsLocked(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md"
                    >
                      Khoá lại
                    </button>
                  </div>
                  
                  <div className="border-b border-gray-200 mb-4">
                    <ShadcnTabs value={subTab} onValueChange={value => setSubTab(value)}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="pending">Đang chờ</TabsTrigger>
                        <TabsTrigger value="answered">Đã trả lời</TabsTrigger>
                        <TabsTrigger value="all">Tất cả</TabsTrigger>
                        <TabsTrigger value="add">Thêm câu hỏi</TabsTrigger>
                      </TabsList>

                      <TabsContent value="pending">
                        {subTab !== 'add' && (
                          <>
                            <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                              <div className="flex gap-2 items-center p-2  flex-wrap">
                                <input
                                  type="text"
                                  placeholder="Tìm kiếm câu hỏi"
                                  value={searchQuestion}
                                  onChange={e => setSearchQuestion(e.target.value)}
                                  className="p-2 border border-gray-200 rounded-md min-w-[180px]"
                                />
                                <input
                                  type="text"
                                  placeholder="Tìm kiếm keyword"
                                  value={searchKeyword}
                                  onChange={e => setSearchKeyword(e.target.value)}
                                  className="p-2 border border-gray-200 rounded-md min-w-[180px]"
                                />
                                <select
                                  value={pendingSortBy}
                                  onChange={(e) => setPendingSortBy(e.target.value as 'createdAt' | 'updatedAt')}
                                  className="p-2 border border-gray-200 rounded-md"
                                >
                                  <option value="createdAt">Ngày tạo</option>
                                  <option value="updatedAt">Ngày cập nhật</option>
                                </select>
                                <select
                                  value={pendingSortOrder}
                                  onChange={(e) => setPendingSortOrder(e.target.value as 'asc' | 'desc')}
                                  className="p-2 border border-gray-200 rounded-md"
                                >
                                  <option value="desc">Mới nhất</option>
                                  <option value="asc">Cũ nhất</option>
                                </select>
                                <button
                                  onClick={() => {
                                    setSortBy(pendingSortBy);
                                    setSortOrder(pendingSortOrder);
                                    handlePendingSearch();
                                  }}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                                >
                                  Tìm kiếm
                                </button>
                                <button
                                  onClick={() => {
                                    setPendingSortBy('createdAt');
                                    setPendingSortOrder('desc');
                                    setSortBy('createdAt');
                                    setSortOrder('desc');
                                    setSearchQuestion("");
                                    setSearchKeyword("");
                                    setIsPendingSearching(false);
                                    setPendingSearchResults([]);
                                  }}
                                  className="px-4 py-2 bg-gray-200 rounded-md"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            {isPendingSearching ? (
                              <div className="mb-6">
                                <div className="text-lg font-semibold text-blue-700 mb-2">Kết quả tìm kiếm</div>
                                {pendingSearchResults.length === 0 ? (
                                  <div className="text-blue-500">Không tìm thấy kết quả phù hợp.</div>
                                ) : (
                                  <>
                                    <div className="text-sm text-gray-500 mb-4">
                                      Tìm thấy {pendingSearchResults.length} kết quả
                                    </div>
                                    <CrudTable 
                                      crudQuestions={pendingSearchResults} 
                                      handleCrudEdit={handleCrudEdit} 
                                      handleCrudDelete={handleCrudDelete} 
                                      handleSortChange={handleSortChange} 
                                      getSortIcon={getSortIcon} 
                                    />
                                  </>
                                )}
                              </div>
                            ) : (
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Câu hỏi đang chờ trả lời</h3>
                                <CrudTable 
                                  crudQuestions={getFilteredCrudQuestions('pending', crudQuestions)} 
                                  handleCrudEdit={handleCrudEdit} 
                                  handleCrudDelete={handleCrudDelete} 
                                  handleSortChange={handleSortChange}
                                  getSortIcon={getSortIcon}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </TabsContent>

                      <TabsContent value="add">
                        <div className="max-w-md mx-auto p-8 mb-10 rounded-2xl shadow-lg">
                          <h2 className="text-center text-2xl font-bold text-blue-700 mb-6">
                            Thêm câu hỏi mới
                          </h2>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Câu hỏi <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                value={form.question}
                                onChange={(e) => setForm({ ...form, question: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                placeholder="Nhập câu hỏi..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Từ khóa <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={form.keyword}
                                onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Nhập từ khóa, phân cách bằng dấu phẩy..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Câu trả lời <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                value={form.answer}
                                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                rows={4}
                                placeholder="Nhập câu trả lời..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hình ảnh
                              </label>
                              <div className="flex items-center gap-4">
                                <button
                                  type="button"
                                  onClick={() => document.getElementById('crud-images')?.click()}
                                  className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                  disabled={isSubmitting}
                                >
                                  <ImageIcon size={20} />
                                  Chọn hình ảnh
                                </button>
                                <p className="text-sm text-gray-500">Hỗ trợ: JPG, PNG (Tối đa 5MB)</p>
                                <input
                                  id="crud-images"
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={handleNewQuestionImageSelect}
                                  className="hidden"
                                  disabled={isSubmitting}
                                />
                              </div>

                              {newQuestionImages.length > 0 && (
                                <div className="grid grid-cols-3 gap-4 mt-4">
                                  {newQuestionImages.map((file, index) => (
                                    <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm">
                                      <Image
                                        src={URL.createObjectURL(file)}
                                        alt={`Preview ${index + 1}`}
                                        width={300}
                                        height={200}
                                        className="w-full h-32 object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                          type="button"
                                          onClick={() => removeNewQuestionImage(index)}
                                          className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                          disabled={isSubmitting}
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {submitError && (
                              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-red-600">{submitError}</p>
                              </div>
                            )}

                            <div className="flex justify-end gap-4">
                              <button
                                type="button"
                                onClick={handleEditClose}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                disabled={isSubmitting}
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                onClick={handleCrudSubmit}
                                disabled={isSubmitting || !form.question.trim() || !form.keyword.trim() || !form.answer.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                {isSubmitting ? (
                                  <>
                                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    Đang xử lý...
                                  </>
                                ) : (
                                  <>
                                    {editingId ? 'Cập nhật' : 'Thêm câu hỏi'}
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="answered">
                        <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                          <div className="flex gap-2 items-center p-2 flex-wrap">
                            <input
                              type="text"
                              placeholder="Tìm kiếm câu hỏi"
                              value={searchQuestion}
                              onChange={e => setSearchQuestion(e.target.value)}
                              className="p-2 border border-gray-200 rounded-md min-w-[180px]"
                            />
                            <input
                              type="text"
                              placeholder="Tìm kiếm keyword"
                              value={searchKeyword}
                              onChange={e => setSearchKeyword(e.target.value)}
                              className="p-2 border border-gray-200 rounded-md min-w-[180px]"
                            />
                            <select
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value)}
                              className="p-2 border border-gray-200 rounded-md"
                            >
                              <option value="createdAt">Ngày tạo</option>
                              <option value="updatedAt">Ngày cập nhật</option>
                              <option value="question">Câu hỏi</option>
                              <option value="keyword">Từ khóa</option>
                              <option value="answer">Câu trả lời</option>
                            </select>
                            <select
                              value={sortOrder}
                              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                              className="p-2 border border-gray-200 rounded-md"
                            >
                              <option value="desc">Giảm dần</option>
                              <option value="asc">Tăng dần</option>
                            </select>
                            <button
                              onClick={handleAnsweredSearch}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md"
                            >
                              Tìm kiếm
                            </button>
                            <button
                              onClick={() => {
                                setSortBy("createdAt");
                                setSortOrder("desc");
                                setSearchQuestion("");
                                setSearchKeyword("");
                                setIsAnsweredSearching(false);
                                setAnsweredSearchResults([]);
                              }}
                              className="px-4 py-2 bg-gray-200 rounded-md"
                            >
                              Đặt lại
                            </button>
                          </div>
                        </div>

                        {isAnsweredSearching ? (
                          <div className="mb-8 bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                            <div className="flex items-center justify-between mb-4">
                              <div className="text-lg font-semibold text-blue-700">Kết quả tìm kiếm</div>
                              <div className="text-sm text-gray-500">
                                {searchQuestion && <span>Câu hỏi: &ldquo;{searchQuestion}&rdquo; </span>}
                                {searchKeyword && <span>Từ khóa: &ldquo;{searchKeyword}&rdquo;</span>}
                              </div>
                            </div>
                            
                            {answeredSearchResults.length === 0 ? (
                              <div className="text-center py-8">
                                <div className="text-blue-500">Không tìm thấy kết quả phù hợp.</div>
                                <button
                                  onClick={() => {
                                    setSearchQuestion("");
                                    setSearchKeyword("");
                                    setIsAnsweredSearching(false);
                                  }}
                                  className="mt-2 text-sm text-gray-600 hover:text-blue-600"
                                >
                                  Xóa tìm kiếm
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="text-sm text-gray-500 mb-4">
                                  Tìm thấy {answeredSearchResults.length} kết quả
                                </div>
                                <CrudTable 
                                  crudQuestions={answeredSearchResults} 
                                  handleCrudEdit={handleCrudEdit} 
                                  handleCrudDelete={handleCrudDelete} 
                                  handleSortChange={handleSortChange}
                                  getSortIcon={getSortIcon}
                                />
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Câu hỏi đã trả lời</h3>
                            <CrudTable 
                              crudQuestions={getFilteredCrudQuestions('answered', crudQuestions)} 
                              handleCrudEdit={handleCrudEdit} 
                              handleCrudDelete={handleCrudDelete} 
                              handleSortChange={handleSortChange}
                              getSortIcon={getSortIcon}
                            />
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="all">
                        <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                          <div className="flex gap-2 items-center p-2 border border-gray-200 rounded-md flex-wrap">
                            <input
                              type="text"
                              placeholder="Tìm kiếm câu hỏi"
                              value={searchQuestion}
                              onChange={e => setSearchQuestion(e.target.value)}
                              className="p-2 border border-gray-200 rounded-md min-w-[180px]"
                            />
                            <input
                              type="text"
                              placeholder="Tìm kiếm keyword"
                              value={searchKeyword}
                              onChange={e => setSearchKeyword(e.target.value)}
                              className="p-2 border border-gray-200 rounded-md min-w-[180px]"
                            />
                            <select
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value)}
                              className="p-2 border border-gray-200 rounded-md"
                            >
                              <option value="createdAt">Ngày tạo</option>
                              <option value="updatedAt">Ngày cập nhật</option>
                              <option value="question">Câu hỏi</option>
                              <option value="keyword">Từ khóa</option>
                              <option value="answer">Câu trả lời</option>
                            </select>
                            <select
                              value={sortOrder}
                              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                              className="p-2 border border-gray-200 rounded-md"
                            >
                              <option value="desc">Giảm dần</option>
                              <option value="asc">Tăng dần</option>
                            </select>
                            <button
                              onClick={handleSearch}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md"
                            >
                              Tìm kiếm
                            </button>
                            <button
                              onClick={() => {
                                setSortBy("createdAt");
                                setSortOrder("desc");
                                setSearchQuestion("");
                                setSearchKeyword("");
                                setIsSearching(false);
                                setSearchResults([]);
                              }}
                              className="px-4 py-2 bg-gray-200 rounded-md"
                            >
                              Đặt lại
                            </button>
                          </div>
                        </div>

                        {isSearching ? (
                          <div className="mb-8 bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                            <div className="flex items-center justify-between mb-4">
                              <div className="text-lg font-semibold text-blue-700">Kết quả tìm kiếm</div>
                              <div className="text-sm text-gray-500">
                                {searchQuestion && <span>Câu hỏi: &ldquo;{searchQuestion}&rdquo; </span>}
                                {searchKeyword && <span>Từ khóa: &ldquo;{searchKeyword}&rdquo;</span>}
                              </div>
                            </div>
                            
                            {searchResults.length === 0 ? (
                                  <div className="text-center py-8">
                                    <div className="text-blue-500">Không tìm thấy kết quả phù hợp.</div>
                                    <button
                                      onClick={() => {
                                        setSearchQuestion("");
                                        setSearchKeyword("");
                                    setIsSearching(false);
                                      }}
                                      className="mt-2 text-sm text-gray-600 hover:text-blue-600"
                                    >
                                      Xóa tìm kiếm
                                    </button>
                                  </div>
                            ) : (
                                <>
                                  <div className="text-sm text-gray-500 mb-4">
                                  Tìm thấy {searchResults.length} kết quả
                                  </div>
                                  <CrudTable 
                                  crudQuestions={searchResults} 
                                    handleCrudEdit={handleCrudEdit} 
                                    handleCrudDelete={handleCrudDelete} 
                                    handleSortChange={handleSortChange}
                                    getSortIcon={getSortIcon}
                                  />
                                </>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-gray-900">Tất cả câu hỏi</h3>
                              <div className="text-sm text-gray-500">
                                Tổng số: {getFilteredCrudQuestions('all', crudQuestions).length} câu hỏi
                              </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm">
                              <CrudTable 
                                crudQuestions={getFilteredCrudQuestions('all', crudQuestions)} 
                                handleCrudEdit={handleCrudEdit} 
                                handleCrudDelete={handleCrudDelete} 
                                handleSortChange={handleSortChange}
                                getSortIcon={getSortIcon}
                              />
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </ShadcnTabs>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="2">
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Câu hỏi mới
                    </label>
                    <textarea
                      value={saleNewQuestion}
                      onChange={(e) => setSaleNewQuestion(e.target.value)}
                      placeholder="Nhập câu hỏi..."
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows={3}
                    />
                  </div>

                  <div className="mb-4">
                    {/* Ẩn phần thêm hình ảnh khi tạo câu hỏi */}
                      <input
                        id="sale-images"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleSaleImageSelect}
                        className="hidden"
                      />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={async () => {
                        if (!saleNewQuestion.trim()) return;
                        
                        console.log('Starting to add sale question...');
                        setIsSubmitting(true);
                        try {
                          // Tạo câu hỏi mới
                          const newQuestionItem = {
                            id: `q-${Date.now()}`,
                            text: saleNewQuestion,
                            images: [],
                            status: "pending" as const,
                            createdAt: new Date(),
                          };
                          
                          // Lưu vào state local
                          setSaleQuestions((prev) => [newQuestionItem, ...prev]);
                          
                          // Log trạng thái khi tạo câu hỏi mới
                          console.log('Creating new sale question with status: pending');
                          
                          // Lưu vào MongoDB - Không sử dụng từ khóa mặc định và đảm bảo status là pending
                          await saveSaleQuestionToMongoDB(
                            saleNewQuestion, // câu hỏi
                            [], // từ khóa (trống)
                            " ", // câu trả lời - thêm khoảng trắng để tránh lỗi validation
                            [] // hình ảnh (trống)
                          );
                          
                          // Reset form
                          setSaleNewQuestion("");
                          setSaleSelectedImages([]);
                          setSaleImagePreviewUrls([]);
                          
                          // Refresh questions list from database
                          await fetchSaleQuestions();
                          
                          setSuccessMsg("Thêm câu hỏi thành công!");
                        } catch (error: any) {
                          console.error("Lỗi:", error);
                          setErrorMsg(error.message || "Có lỗi xảy ra khi tạo câu hỏi mới");
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={!saleNewQuestion.trim() || isSubmitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                    >
                      <PlusCircle size={20} className="inline mr-2" />
                      {isSubmitting ? "Đang xử lý..." : "Thêm câu hỏi"}
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 mb-6">
                  <button
                    className={`px-4 py-2 rounded-l-md ${
                      saleCurrentTab === 'pending'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                    onClick={() => setSaleCurrentTab('pending')}
                  >
                    Chờ trả lời
                  </button>
                  <button
                    className={`px-4 py-2 rounded-r-md ${
                      saleCurrentTab === 'answered'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                    onClick={() => setSaleCurrentTab('answered')}
                  >
                    Đã trả lời
                  </button>
                </div>

                {loadingSaleQuestions ? (
                  <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]" role="status">
                      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                    </div>
                    <p className="mt-2 text-gray-600">Đang tải câu hỏi...</p>
                  </div>
                ) : saleFilteredQuestions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {saleCurrentTab === 'pending'
                      ? 'Không có câu hỏi nào đang chờ'
                      : 'Không có câu hỏi nào đã trả lời'}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {saleFilteredQuestions.map((question) => (
                      <div key={question.id} className="bg-white rounded-lg p-6 shadow-sm">
                        {saleCurrentTab === 'pending' ? (
                          <>
                        <div className="mb-4">
                          <h3 className="font-medium text-gray-900">Câu hỏi:</h3>
                          <p className="mt-1 text-gray-700">{question.text}</p>
                              
                              {question.keyword && (
                                <div className="mt-2">
                                  <h3 className="text-sm font-medium text-gray-700">Từ khóa:</h3>
                                  <span className="inline-flex items-center px-2 py-1 mt-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {question.keyword}
                                  </span>
                                </div>
                              )}
                        </div>

                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Từ khóa
                              </label>
                              <input
                                type="text"
                                value={saleAnswerKeywords[question.id] || question.keyword || ''}
                                onChange={(e) => handleSaleAnswerKeywordChange(question.id, e.target.value)}
                                placeholder="Nhập từ khóa mới hoặc giữ nguyên từ khóa cũ..."
                                className="w-full p-2 border border-gray-300 rounded-md"
                              />
                            </div>

                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Câu trả lời
                              </label>
                              <textarea
                                value={saleAnswers[question.id] || ''}
                                onChange={(e) => handleSaleAnswerChange(question.id, e.target.value)}
                                placeholder="Nhập câu trả lời..."
                                className="w-full p-2 border border-gray-300 rounded-md"
                                rows={3}
                              />
                            </div>

                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hình ảnh đính kèm
                              </label>
                              <div className="flex items-center gap-4">
                                <button
                                  type="button"
                                  onClick={() => document.getElementById(`answer-images-${question.id}`)?.click()}
                                  className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                  <ImageIcon size={20} />
                                  Chọn hình ảnh
                                </button>
                                <p className="text-sm text-gray-500">Hỗ trợ: JPG, PNG (Tối đa 5MB)</p>
                                <input
                                  id={`answer-images-${question.id}`}
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={(e) => handleImageSelect(e, question.id)}
                                  className="hidden"
                                />
                              </div>

                              {questionImages[question.id]?.length > 0 && (
                                <div className="grid grid-cols-3 gap-4 mt-4">
                                  {questionImages[question.id].map((file, index) => (
                                    <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm">
                                      <Image
                                        src={URL.createObjectURL(file)}
                                        alt={`Answer image ${index + 1}`}
                                        width={300}
                                        height={200}
                                        className="w-full h-32 object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                          type="button"
                                          onClick={() => removeImage(question.id, index)}
                                          className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => deleteSaleQuestion(question.id)}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} className="inline mr-2" />
                                Xóa
                              </button>
                              <button
                                onClick={() => answerSaleQuestion(question.id)}
                                disabled={!saleAnswers[question.id]?.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                              >
                                Trả lời
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="mb-4">
                              <h3 className="font-medium text-gray-900">Câu hỏi:</h3>
                              <p className="mt-1 text-gray-700">{question.text}</p>
                              
                              {question.keyword && (
                                <div className="mt-2">
                                  <h3 className="text-sm font-medium text-gray-700">Từ khóa:</h3>
                                  <span className="inline-flex items-center px-2 py-1 mt-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {question.keyword}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="mb-4">
                              <h3 className="font-medium text-gray-900">Câu trả lời:</h3>
                              <p className="mt-1 text-gray-700">{question.answer}</p>
                            </div>

                            {question.images && question.images.length > 0 && (
                              <div className="mt-2">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Hình ảnh đính kèm:</h3>
                                <div className="grid grid-cols-3 gap-4">
                                  {question.images.map((image, index) => {
                                    const imageUrl = typeof image === 'string' ? image : image.url;
                                    const fullImageUrl = getImageUrl(imageUrl);
                                    if (!fullImageUrl) return null;
                                    
                                    return (
                                      <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm">
                                        <Image
                                          src={fullImageUrl}
                                          alt={`Answer image ${index + 1}`}
                                          width={300}
                                          height={200}
                                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                          onError={(e) => {
                                            console.error(`Error loading image ${index + 1}:`, fullImageUrl);
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            target.style.display = 'none';
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity">
                                          <a
                                            href={fullImageUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                          >
                                            <span className="p-2 bg-white rounded-full">
                                              <ExternalLink size={16} className="text-gray-900" />
                                            </span>
                                          </a>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end gap-2">
                              <button
                                onClick={async () => {
                                  handleSaleAnswerChange(question.id, question.answer || "");
                                  
                                  try {
                                    // Cập nhật trạng thái thành 'pending' qua API
                                    if (question._id) {
                                      const updateData = {
                                        status: 'pending'
                                      };
                                      
                                      console.log('Đang đặt lại trạng thái câu hỏi thành pending:', question._id);
                                      
                                      const response = await fetch(`/api/questions/${question._id}`, {
                                        method: "PUT",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify(updateData),
                                      });
                                      
                                      if (response.ok) {
                                        console.log('Đã cập nhật trạng thái thành pending thành công');
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Lỗi khi cập nhật trạng thái:', error);
                                  }
                                  
                                  resetSaleToPending(question.id);
                                }}
                                className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <Edit size={16} />
                                Sửa
                              </button>
                              <button
                                onClick={() => deleteSaleQuestion(question.id)}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} className="inline mr-2" />
                                Xóa
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </ShadcnTabs>
          
          <ScrollToTop />
        </div>
      </div>

      {/* Edit Dialog */}
      {editOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Sửa câu hỏi
              </h2>
              <button
                onClick={handleEditClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Câu hỏi <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Nhập câu hỏi..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ khóa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.keyword}
                  onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập từ khóa, phân cách bằng dấu phẩy..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Câu trả lời <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Nhập câu trả lời..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => document.getElementById('edit-images')?.click()}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    disabled={isSubmitting}
                  >
                    <ImageIcon size={20} />
                    Chọn hình ảnh
                  </button>
                  <p className="text-sm text-gray-500">Hỗ trợ: JPG, PNG (Tối đa 5MB)</p>
                  <input
                    id="edit-images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleEditImageSelect}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </div>

                {editImagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {editImagePreviews.map((url, index) => (
                      <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm">
                        <Image
                          src={url}
                          alt={`Preview ${index + 1}`}
                          width={300}
                          height={200}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeEditImage(index)}
                            className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            disabled={isSubmitting}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600">{submitError}</p>
                </div>
              )}

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={handleEditClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCrudSubmit}
                  disabled={isSubmitting || !form.question.trim() || !form.keyword.trim() || !form.answer.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    'Cập nhật'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {successMsg}
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {errorMsg}
        </div>
      )}

      {/* Pagination */}
      {crudTotal > 0 ? (
        <div className="mt-6 flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{Math.min((crudPage - 1) * 10 + 1, crudTotal)}</span> đến{' '}
              <span className="font-medium">
                {Math.min(crudPage * 10, crudTotal)}
              </span>{' '}
              trong tổng số <span className="font-medium">{crudTotal}</span> câu hỏi
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchCrudQuestions(1)}
              disabled={crudPage === 1}
              className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Trang đầu</span>
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => fetchCrudQuestions(crudPage - 1)}
              disabled={crudPage === 1}
              className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Trang trước</span>
              <ChevronLeft size={16} />
            </button>
            <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
              {crudPage} / {Math.max(1, Math.ceil(crudTotal / 10))}
            </span>
            <button
              onClick={() => fetchCrudQuestions(crudPage + 1)}
              disabled={crudPage * 10 >= crudTotal}
              className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Trang sau</span>
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => fetchCrudQuestions(Math.ceil(crudTotal / 10))}
              disabled={crudPage * 10 >= crudTotal}
              className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Trang cuối</span>
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 text-center py-8 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">Không có câu hỏi nào</p>
          <button
            onClick={() => fetchCrudQuestions(1)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Tải lại dữ liệu
          </button>
        </div>
      )}
    </div>
  );
} 