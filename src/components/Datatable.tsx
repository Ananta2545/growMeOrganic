import { useEffect, useRef, useState } from "react";
import { fetchApi } from "../services/api";
import { DataTable, type DataTableSelectionMultipleChangeEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Paginator, type PaginatorPageChangeEvent } from "primereact/paginator";
import { useNavigate, useLocation } from "react-router-dom";

interface ArtWork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

interface ApiResponse {
  data: ArtWork[];
  pagination: {
    limit: number;
    total: number;
  };
}

export const Datatable = () => {
  const [data, setData] = useState<ArtWork[]>([]);
  const [selectedRows, setSelectedRows] = useState<Record<number, ArtWork>>({});
  const [page, setPage] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pagination, setPagination] = useState(0);
  const [selectNumber, setSelectNumber] = useState<number | "">("");

  const overlayPanel = useRef<OverlayPanel>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const p = parseInt(params.get("page") || "1", 10);
    setPage(p - 1);
  }, [location.search]);

  useEffect(() => {
    loadData(page + 1);
  }, [page]);

  const loadData = async (p: number) => {
    const res: ApiResponse = await fetchApi(p);
    setPagination(res.pagination.limit);
    setTotalRecords(res.pagination.total);
    setData(res.data);
  };

  const currentPageSelection = data.filter((row) => selectedRows[row.id]);

  const handlePageChange = (e: PaginatorPageChangeEvent) => {
    setPage(e.page);
    const params = new URLSearchParams(location.search);
    params.set("page", String(e.page + 1));
    navigate({ search: params.toString() }, { replace: true });
  };

  const handleSelectNumber = async (num: number) => {
    const newSelected: Record<number, ArtWork> = { ...selectedRows };
    let allRowsFetched: ArtWork[] = [];
    let pageToFetch = 1;

    while (allRowsFetched.length < num && (pageToFetch - 1) * pagination < totalRecords) {
      const res: ApiResponse = await fetchApi(pageToFetch);
      allRowsFetched = allRowsFetched.concat(res.data);
      pageToFetch++;
    }

    const firstNRows = allRowsFetched.slice(0, num);

    const allAlreadySelected = firstNRows.every((row) => newSelected[row.id]);

    if (allAlreadySelected) {
      firstNRows.forEach((row) => delete newSelected[row.id]);
    } else {
      firstNRows.forEach((row) => {
        newSelected[row.id] = row;
      });
    }

    setSelectedRows(newSelected);
    setSelectNumber("");
    overlayPanel.current?.hide();
  };

  const selectionHeader = (
    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
      <Checkbox
        checked={currentPageSelection.length === data.length && data.length > 0}
        onChange={(e) => {
          const updated = { ...selectedRows };
          if (e.checked) data.forEach((row) => (updated[row.id] = row));
          else data.forEach((row) => delete updated[row.id]);
          setSelectedRows(updated);
        }}
      />
      <Button
        type="button"
        icon="pi pi-chevron-down"
        className="p-button-text p-button-sm"
        onClick={(e) => overlayPanel.current?.toggle(e)}
      />
      <OverlayPanel ref={overlayPanel} showCloseIcon dismissable>
        <div style={{ marginBottom: "0.5rem" }} onClick={(e) => e.stopPropagation()}>
          <input
            ref={inputRef}
            type="number"
            value={selectNumber}
            placeholder="Enter number of rows..."
            style={{ width: "100%", padding: "0.25rem" }}
            onChange={(e) => {
              const num = parseInt(e.target.value, 10);
              if (isNaN(num)) setSelectNumber("");
              else setSelectNumber(num);
            }}
          />
        </div>
        <Button
          label="Submit"
          icon="pi pi-check"
          className="p-button-sm"
          onClick={() => {
            const num = parseInt(inputRef.current?.value || "", 10);
            if (!isNaN(num)) handleSelectNumber(num);
          }}
        />
      </OverlayPanel>
    </div>
  );

  return (
    <div>
      <DataTable
        value={data}
        selection={Object.values(selectedRows)}
        onSelectionChange={(e: DataTableSelectionMultipleChangeEvent<ArtWork[]>) => {
          const selected: ArtWork[] = Array.isArray(e.value) ? e.value : [];
          const updated: Record<number, ArtWork> = { ...selectedRows };

          data.forEach((row) => {
            if (updated[row.id] && !selected.find((s) => s.id === row.id)) {
              delete updated[row.id];
            }
          });

          selected.forEach((row) => {
            updated[row.id] = row;
          });

          setSelectedRows(updated);
        }}
        dataKey="id"
        rows={pagination}
        selectionMode="multiple"
        paginator={false}
        tableStyle={{ minWidth: "50rem" }}
      >
        <Column selectionMode="multiple" header={selectionHeader} />
        <Column field="title" header="Title" body={(row) => row.title ?? "null"} />
        <Column field="place_of_origin" header="Origin" body={(row) => row.place_of_origin ?? "null"} />
        <Column field="artist_display" header="Artist" body={(row) => row.artist_display ?? "null"} />
        <Column field="inscriptions" header="Inscriptions" body={(row) => row.inscriptions ?? "null"} />
        <Column field="date_start" header="Start Date" body={(row) => row.date_start ?? "null"} />
        <Column field="date_end" header="End Date" body={(row) => row.date_end ?? "null"} />
      </DataTable>

      <Paginator
        first={page * pagination}
        rows={pagination}
        totalRecords={totalRecords}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
