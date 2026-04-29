import React from 'react';
import { Button, Space, Tooltip, message } from 'antd';
import { FileExcelOutlined, FileWordOutlined } from '@ant-design/icons';

type DataRecord = Record<string, unknown>;

interface TableColumn {
    title: string;
    dataIndex?: string;
    key?: string;
    render?: (value: unknown, record: DataRecord) => React.ReactNode;
}

interface ExportButtonsProps {
    data: DataRecord[];
    columns: TableColumn[];
    filename: string;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ data, columns, filename }) => {
    if (!data || data.length === 0) return null;

    const extractText = (value: unknown, record: DataRecord, column: TableColumn): string => {
        if (column.render) {
            const rendered = column.render(value, record);
            if (typeof rendered === 'string') {
                return rendered;
            }
            if (rendered && typeof rendered === 'object') {
                const element = rendered as React.ReactElement;
                const props = element.props as { children?: React.ReactNode };
                if (props?.children) {
                    if (typeof props.children === 'string') {
                        return props.children;
                    }
                    if (Array.isArray(props.children)) {
                        return props.children.map((c) => (typeof c === 'string' ? c : '')).join('');
                    }
                }
                return '';
            }
            return String(rendered);
        }
        return value !== undefined && value !== null ? String(value) : '';
    };

    const prepareDataForExport = (): Record<string, string>[] => {
        return data.map((record) => {
            const exportRecord: Record<string, string> = {};
            columns.forEach((col) => {
                const title = col.title;
                const dataIndex = col.dataIndex;
                const value = dataIndex ? record[dataIndex] : '';
                exportRecord[title] = extractText(value, record, col);
            });
            return exportRecord;
        });
    };

    // Экспорт в Excel с правильной кодировкой
    const exportToExcel = async (): Promise<void> => {
        try {
            const exportData = prepareDataForExport();
            const XLSX = await import('xlsx');

            // Создаем workbook
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, filename);

            // Записываем файл
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

            // Создаем Blob с правильным MIME-типом
            const blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            // Скачиваем
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = `${filename}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            message.success(`Файл "${filename}.xlsx" сохранён`);
        } catch (error) {
            console.error('Ошибка экспорта в Excel:', error);
            message.error('Ошибка при создании Excel файла');
        }
    };

    // Экспорт в Word с правильной кодировкой (UTF-8 с BOM)
    const exportToWord = (): void => {
        try {
            const exportData = prepareDataForExport();

            // BOM для UTF-8 (обязательно!)
            const BOM = '\uFEFF';

            // HTML с явным указанием кодировки
            const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>${filename}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 20px; 
            font-size: 14px;
        }
        h2 { 
            color: #333; 
            margin-bottom: 10px;
        }
        .date { 
            color: #666; 
            margin-bottom: 20px;
            font-size: 12px;
        }
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-top: 20px;
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
        }
        th { 
            background-color: #f2f2f2; 
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
    </style>
</head>
<body>
    <h2>${filename}</h2>
    <p class="date">Дата формирования: ${new Date().toLocaleString('ru-RU')}</p>
    <table>
        <thead>
            <tr>
                ${columns.map((col) => `<th>${col.title}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${exportData.map((row) => `
                <tr>
                    ${columns.map((col) => `<td>${row[col.title] || ''}</td>`).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>
    <p class="date">Сформировано в системе "SweetCRM"</p>
</body>
</html>`;

            // Добавляем BOM в начало файла
            const blob = new Blob([BOM + htmlContent], { type: 'application/msword;charset=utf-8' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = `${filename}.doc`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            message.success(`Файл "${filename}.doc" сохранён`);
        } catch (error) {
            console.error('Ошибка экспорта в Word:', error);
            message.error('Ошибка при создании Word файла');
        }
    };

    return (
        <Space>
            <Tooltip title="Экспорт в Excel">
                <Button
                    icon={<FileExcelOutlined />}
                    onClick={exportToExcel}
                    style={{ color: '#52c41a', borderColor: '#52c41a' }}
                >
                    Excel
                </Button>
            </Tooltip>
            <Tooltip title="Экспорт в Word">
                <Button
                    icon={<FileWordOutlined />}
                    onClick={exportToWord}
                    style={{ color: '#1890ff', borderColor: '#1890ff' }}
                >
                    Word
                </Button>
            </Tooltip>
        </Space>
    );
};

export default ExportButtons;