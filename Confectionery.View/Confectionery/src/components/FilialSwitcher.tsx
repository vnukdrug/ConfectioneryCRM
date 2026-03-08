import React, { useState, useEffect } from 'react';
import { Select, message } from 'antd';
import { api } from '../api/api';

const { Option } = Select;

interface FilialSwitcherProps {
    onFilialChange: (filialId: number | null) => void;
}

const FilialSwitcher: React.FC<FilialSwitcherProps> = ({ onFilialChange }) => {
    const [filials, setFilials] = useState<{ id: number; name: string }[]>([]);
    const [selectedFilial, setSelectedFilial] = useState<number | null>(null);
    const user = api.getCurrentUser();

    useEffect(() => {
        let isMounted = true;

        const loadFilials = async () => {
            try {
                const data = await api.getFilials();
                if (isMounted) {
                    setFilials(data);
                    
                    // Используем user?.role внутри эффекта
                    if (user?.role === 'Admin') {
                        setSelectedFilial(null);
                        onFilialChange(null);
                    }
                }
            } catch {
                if (isMounted) {
                    message.error('Ошибка загрузки филиалов');
                }
            }
        };

        loadFilials();

        return () => {
            isMounted = false;
        };
    }, [onFilialChange, user?.role]); // 👈 Добавляем зависимости

    const handleChange = (value: number) => {
        setSelectedFilial(value);
        onFilialChange(value);
    };

    const handleClear = () => {
        setSelectedFilial(null);
        onFilialChange(null);
    };

    if (user?.role !== 'Admin') {
        return null;
    }

    return (
        <Select
            placeholder="Все филиалы"
            style={{ width: 200, marginRight: 16 }}
            onChange={handleChange}
            onClear={handleClear}
            value={selectedFilial}
            allowClear
        >
            {filials.map(f => (
                <Option key={f.id} value={f.id}>{f.name}</Option>
            ))}
        </Select>
    );
};

export default FilialSwitcher;