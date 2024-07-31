import React, { useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Pagination,
} from "@nextui-org/react";
import { SearchIcon } from "lucide-react";

interface DynamicTableProps {
  data: string;
}

const DynamicTable: React.FC<DynamicTableProps> = ({ data }) => {
  const [filterValue, setFilterValue] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const { columns, rows } = useMemo(() => {
    const lines = data.trim().split("\n");
    const allColumns = new Set<string>();
    const parsedRows = lines.map((line, index) => {
      const row: Record<string, string> = { id: index.toString() };
      line.split("\t").forEach((pair) => {
        const [key, value] = pair.split(":").map((s) => s.trim());
        row[key] = value;
        allColumns.add(key);
      });
      return row;
    });
    return {
      columns: Array.from(allColumns),
      rows: parsedRows,
    };
  }, [data]);

  const filteredItems = useMemo(() => {
    return rows.filter((row) =>
      Object.values(row).some((value) =>
        value.toLowerCase().includes(filterValue.toLowerCase())
      )
    );
  }, [rows, filterValue]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems]);

  const renderCell = React.useCallback((row: any, columnKey: React.Key) => {
    const cellValue = row[columnKey as string];
    return cellValue;
  }, []);

  return (
    <div>
      <Input
        placeholder="Search..."
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
        startContent={<SearchIcon size={18} />}
        className="mb-4"
      />
      <Table
        aria-label="Dynamic SQL data table"
        bottomContent={
          <div className="flex w-full justify-center">
            <Pagination
              isCompact
              showControls
              showShadow
              color="primary"
              page={page}
              total={pages}
              onChange={(page) => setPage(page)}
            />
          </div>
        }
        bottomContentPlacement="outside"
      >
        <TableHeader>
          {columns.map((column) => (
            <TableColumn key={column}>{column}</TableColumn>
          ))}
        </TableHeader>
        <TableBody items={items}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DynamicTable;
