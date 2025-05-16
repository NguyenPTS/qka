# Hu01b0u1edbng du1eabn su1eeda lu1ed7i vu00e0 cu1ea3i tiu1ebfn u1ee9ng du1ee5ng

## I. Su1eeda lu1ed7i hiu1ec3n thu1ecb hu00ecnh u1ea3nh

1. Su1eeda lu1ed7i `getImageUrl is not defined` bu1eb1ng cu00e1ch thu00eam du00f2ng import vu00e0o u0111u1ea7u file `app/page.tsx`:

```typescript
import { getImageUrl, getKeywordsArray, sortQuestions, filterQuestionsByTab, isQuestionComplete } from './utils/helpers';
import { saveSaleQuestionToMongoDB, saveSaleAnswerToMongoDB } from './utils/questionUtils';
```

2. Xu00f3a cu00e1c hu00e0m tru00f9ng lu1eb7p trong file `app/page.tsx` (nu1ebfu cu00f3):
   - `getImageUrl`
   - `sortQuestions`
   - `getKeywordsArray`
   - `saveSaleQuestionToMongoDB`
   - `saveSaleAnswerToMongoDB`

## II. Su1eeda lu1ed7i vu1edbi hu00e0m `saveSaleQuestionToMongoDB`

Tu1ea1i cu00e1c vu1ecb tru00ed gu1ecdi hu00e0m nu00e0y, cu1ea7n truyu1ec1n u0111u1ee7 4 tham su1ed1:

```typescript
await saveSaleQuestionToMongoDB(
  saleNewQuestion, // cu00e2u hu1ecfi
  [], // tu1eeb khu00f3a (tru1ed1ng)
  "", // cu00e2u tru1ea3 lu1eddi (tru1ed1ng)
  [] // hu00ecnh u1ea3nh (tru1ed1ng)
);
```

## III. Thay u0111u1ed5i logic hiu1ec3n thu1ecb trong phu1ea7n quu1ea3n lu00fd cu00e2u hu1ecfi

1. Xu00f3a TabsTrigger "done" (tab "u0110u00e3 tru1ea3 lu1eddi"):

```typescript
<TabsList className="mb-4">
  <TabsTrigger value="pending">u0110ang chu1edd</TabsTrigger>
  <TabsTrigger value="all">Tu1ea5t cu1ea3</TabsTrigger>
  <TabsTrigger value="add">Thu00eam cu00e2u hu1ecfi</TabsTrigger>
</TabsList>
```

2. Xu00f3a TabsContent "done":

```typescript
<TabsContent value="done">
  {/* Xu00f3a nu1ed9i dung tab nu00e0y */}
</TabsContent>
```

3. Su1eeda lu1ed7i logic hiu1ec3n thu1ecb trong TabsContent "pending" vu00e0 "all":

```typescript
<TabsContent value="pending">
  {/* ... code hiu1ec7n tu1ea1i ... */}
  
  {/* Khi hiu1ec3n thu1ecb danh su00e1ch cu00e2u hu1ecfi, thay u0111u1ed5i vu1edbi: */}
  <CrudTable 
    crudQuestions={filterQuestionsByTab(crudQuestions, 'pending')} 
    handleCrudEdit={handleCrudEdit} 
    handleCrudDelete={handleCrudDelete} 
    handleSortChange={handleSortChange}
    getSortIcon={getSortIcon}
  />
</TabsContent>

<TabsContent value="all">
  {/* ... code hiu1ec7n tu1ea1i ... */}
  
  {/* Khi hiu1ec3n thu1ecb danh su00e1ch cu00e2u hu1ecfi, thay u0111u1ed5i vu1edbi: */}
  <CrudTable 
    crudQuestions={filterQuestionsByTab(crudQuestions, 'all')} 
    handleCrudEdit={handleCrudEdit} 
    handleCrudDelete={handleCrudDelete} 
    handleSortChange={handleSortChange}
    getSortIcon={getSortIcon}
  />
</TabsContent>
```

## IV. Thay u0111u1ed5i logic u0111u1ed1i vu1edbi cu00e2u hu1ecfi tu1eeb sale

Khi thu00eam cu00e2u hu1ecfi mu1edbi tu1eeb tab "Thu00eam cu00e2u hu1ecfi bu1edfi sale", cu1ea7n u0111u1ea3m bu1ea3o:

```typescript
const addSaleQuestion = async () => {
  if (!saleNewQuestion.trim()) return;
  
  try {
    // Tu1ea1o cu00e2u hu1ecfi mu1edbi 
    const newQuestionItem = {
      id: `q-${Date.now()}`,
      text: saleNewQuestion,
      images: [],
      status: "pending" as const,
      createdAt: new Date(),
    };
    
    // Lu01b0u vu00e0o state local
    setSaleQuestions((prev) => [newQuestionItem, ...prev]);
    
    // Lu01b0u vu00e0o MongoDB - phu1ea3i truyu1ec1n u0111u1ee7 4 tham su1ed1
    await saveSaleQuestionToMongoDB(
      saleNewQuestion, // cu00e2u hu1ecfi
      [], // tu1eeb khu00f3a (tru1ed1ng)
      "", // cu00e2u tru1ea3 lu1eddi (tru1ed1ng)
      [] // hu00ecnh u1ea3nh (tru1ed1ng)
    );
    
    // Reset form
    setSaleNewQuestion("");
    setSaleSelectedImages([]);
    setSaleImagePreviewUrls([]);
    
    setSuccessMsg("Thu00eam cu00e2u hu1ecfi thu00e0nh cu00f4ng!");
  } catch (error: any) {
    console.error("Lu1ed7i:", error);
    setErrorMsg(error.message || "Cu00f3 lu1ed7i xu1ea3y ra!");
  }
};
```

## V. Cu1eadp nhu1eadt fetch danh su00e1ch cu00e2u hu1ecfi

Khi fetch danh su00e1ch cu00e2u hu1ecfi, cu1ea7n u0111u1ea3m bu1ea3o cu00e1c cu00e2u hu1ecfi u0111u01b0u1ee3c phu00e2n lou1ea1i u0111u00fang:

```typescript
const fetchCrudQuestions = useCallback(async (page = 1, sortByParam = sortBy, sortOrderParam = sortOrder) => {
  // ... code hiu1ec7n tu1ea1i ...
  
  // Sau khi lu1ea5y du1eef liu1ec7u cu00e2u hu1ecfi thu00e0nh cu00f4ng
  if (data.success && data.data && Array.isArray(data.data.questions)) {
    // Cu1eadp nhu1eadt cu00e2u hu1ecfi u0111u00e3 lu1ea5y vu1ec1
    setCrudQuestions(data.data.questions);
    
    // Nu1ebfu u0111ang u1edf tab pending, hiu1ec3n thu1ecb chu1ec9 nhu1eefng cu00e2u hu1ecfi chu01b0a tru1ea3 lu1eddi
    if (subTab === 'pending') {
      setSubTab('pending'); // u0110u1ea3m bu1ea3o view hiu1ec3n thu1ecb cu1eadp nhu1eadt
    }
  }
  
  // ... code hiu1ec7n tu1ea1i ...
}, [sortBy, sortOrder, subTab]);
``` 