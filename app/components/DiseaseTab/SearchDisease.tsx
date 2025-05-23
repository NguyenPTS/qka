import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export type DiseaseSearchFilter = {
  name?: string;
  phone?: string;
  disease?: string;
};

type Props = {
  value: DiseaseSearchFilter;
  onChange: (filter: DiseaseSearchFilter) => void;///
};

export default function SearchDisease({ value, onChange }: Props) {
  const [local, setLocal] = useState<DiseaseSearchFilter>(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocal(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    onChange(local);
  };

  const handleClear = () => {
    setLocal({});
    onChange({});
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-end mb-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Tên bệnh nhân</label>
        <Input name="name" value={local.name || ""} onChange={handleChange} placeholder="Nhập tên khách hàng..." />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
        <Input name="phone" value={local.phone || ""} onChange={handleChange} placeholder="Nhập SĐT..." />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Bệnh lý</label>
        <Input name="disease" value={local.disease || ""} onChange={handleChange} placeholder="Nhập tên bệnh lý..." />
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={handleSearch} className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm">Tìm kiếm</Button>
        <Button type="button" onClick={handleClear} className="h-10 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold border border-gray-300 shadow-sm">Xoá lọc</Button>
      </div>
    </div>
  );
}
