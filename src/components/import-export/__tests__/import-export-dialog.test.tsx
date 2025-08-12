import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportExportDialog } from '../import-export-dialog';

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document methods
Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    setAttribute: jest.fn(),
    click: jest.fn(),
    style: {},
  })),
});

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
  value: jest.fn(),
});

describe.skip('ImportExportDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('should render the dialog trigger button', () => {
    render(<ImportExportDialog />);
    
    const triggerButton = screen.getByRole('button', { name: /数据管理/i });
    expect(triggerButton).toBeInTheDocument();
  });

  it('should open dialog when trigger button is clicked', () => {
    render(<ImportExportDialog />);
    
    const triggerButton = screen.getByRole('button', { name: /数据管理/i });
    fireEvent.click(triggerButton);
    
    expect(screen.getByText('数据导入导出')).toBeInTheDocument();
    expect(screen.getByText('数据导入')).toBeInTheDocument();
    expect(screen.getByText('数据导出')).toBeInTheDocument();
  });

  describe('Import Tab', () => {
    beforeEach(() => {
      render(<ImportExportDialog />);
      const triggerButton = screen.getByRole('button', { name: /数据管理/i });
      fireEvent.click(triggerButton);
    });

    it('should show import form elements', () => {
      expect(screen.getByText('选择数据类型')).toBeInTheDocument();
      expect(screen.getByText('选择CSV文件')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /开始导入/i })).toBeInTheDocument();
    });

    it('should enable import button when file and type are selected', () => {
      const fileInput = screen.getByLabelText(/选择CSV文件/i);
      const typeSelect = screen.getByRole('combobox');
      const importButton = screen.getByRole('button', { name: /开始导入/i });

      expect(importButton).toBeDisabled();

      // Select data type
      fireEvent.click(typeSelect);
      fireEvent.click(screen.getByText('交易记录'));

      // Select file
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(importButton).not.toBeDisabled();
    });

    it('should show selected file name', () => {
      const fileInput = screen.getByLabelText(/选择CSV文件/i);
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(screen.getByText('已选择文件: test.csv')).toBeInTheDocument();
    });

    it('should handle successful import', async () => {
      const mockResponse = {
        success: true,
        imported: 5,
        errors: [],
        duplicates: 1,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      // Mock window.location.reload
      Object.defineProperty(window, 'location', {
        value: { reload: jest.fn() },
        writable: true,
      });

      const fileInput = screen.getByLabelText(/选择CSV文件/i);
      const typeSelect = screen.getByRole('combobox');
      const importButton = screen.getByRole('button', { name: /开始导入/i });

      // Select data type
      fireEvent.click(typeSelect);
      fireEvent.click(screen.getByText('交易记录'));

      // Select file
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Start import
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('导入成功')).toBeInTheDocument();
        expect(screen.getByText('成功导入: 5 条记录')).toBeInTheDocument();
        expect(screen.getByText('重复跳过: 1 条记录')).toBeInTheDocument();
      });

      expect(window.location.reload).toHaveBeenCalled();
    });

    it('should handle import errors', async () => {
      const mockResponse = {
        success: false,
        imported: 0,
        errors: ['无效的数据格式', '缺少必需字段'],
        duplicates: 0,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      const fileInput = screen.getByLabelText(/选择CSV文件/i);
      const typeSelect = screen.getByRole('combobox');
      const importButton = screen.getByRole('button', { name: /开始导入/i });

      // Select data type and file
      fireEvent.click(typeSelect);
      fireEvent.click(screen.getByText('交易记录'));
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Start import
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('导入失败')).toBeInTheDocument();
        expect(screen.getByText('无效的数据格式')).toBeInTheDocument();
        expect(screen.getByText('缺少必需字段')).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const fileInput = screen.getByLabelText(/选择CSV文件/i);
      const typeSelect = screen.getByRole('combobox');
      const importButton = screen.getByRole('button', { name: /开始导入/i });

      // Select data type and file
      fireEvent.click(typeSelect);
      fireEvent.click(screen.getByText('交易记录'));
      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Start import
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('导入失败，请稍后重试')).toBeInTheDocument();
      });
    });
  });

  describe('Export Tab', () => {
    beforeEach(() => {
      render(<ImportExportDialog />);
      const triggerButton = screen.getByRole('button', { name: /数据管理/i });
      fireEvent.click(triggerButton);
      
      // Switch to export tab
      fireEvent.click(screen.getByText('数据导出'));
    });

    it('should show export form elements', () => {
      expect(screen.getByText('选择要导出的数据')).toBeInTheDocument();
      expect(screen.getByLabelText('账户信息')).toBeInTheDocument();
      expect(screen.getByLabelText('交易记录')).toBeInTheDocument();
      expect(screen.getByLabelText('复盘日志')).toBeInTheDocument();
      expect(screen.getByLabelText('投资计划')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /开始导出/i })).toBeInTheDocument();
    });

    it('should enable export button when data types are selected', () => {
      const exportButton = screen.getByRole('button', { name: /开始导出/i });
      const accountsCheckbox = screen.getByLabelText('账户信息');

      expect(exportButton).toBeDisabled();

      fireEvent.click(accountsCheckbox);

      expect(exportButton).not.toBeDisabled();
    });

    it('should handle successful export', async () => {
      const mockExportData = {
        accounts: [
          { name: '账户1', type: 'stock', balance: 50000 },
          { name: '账户2', type: 'fund', balance: 30000 },
        ],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve(mockExportData),
      });

      const exportButton = screen.getByRole('button', { name: /开始导出/i });
      const accountsCheckbox = screen.getByLabelText('账户信息');

      // Select accounts for export
      fireEvent.click(accountsCheckbox);

      // Start export
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/import-export?userId=1&dataTypes=accounts')
        );
      });

      // Verify CSV download was triggered
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should handle multiple data type selection', () => {
      const accountsCheckbox = screen.getByLabelText('账户信息');
      const transactionsCheckbox = screen.getByLabelText('交易记录');

      fireEvent.click(accountsCheckbox);
      fireEvent.click(transactionsCheckbox);

      expect(accountsCheckbox).toBeChecked();
      expect(transactionsCheckbox).toBeChecked();
    });

    it('should handle export errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Export error'));

      // Mock alert
      window.alert = jest.fn();

      const exportButton = screen.getByRole('button', { name: /开始导出/i });
      const accountsCheckbox = screen.getByLabelText('账户信息');

      fireEvent.click(accountsCheckbox);
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('导出失败，请稍后重试');
      });
    });
  });
});
