import { CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Fragment, useMemo } from 'react';

interface TransactionPaginationProps {
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startItem: number;
  endItem: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
}

const MAX_VISIBLE_PAGES = 5;

const TransactionPagination = ({
  itemsPerPage,
  onItemsPerPageChange,
  currentPage,
  totalPages,
  totalItems,
  startItem,
  endItem,
  onPageChange,
  onNextPage,
  onPreviousPage,
}: TransactionPaginationProps) => {
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];

    if (totalPages <= MAX_VISIBLE_PAGES) {
      for (let page = 1; page <= totalPages; page += 1) {
        pages.push(page);
      }
      return pages;
    }

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  return (
    <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-4">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div>
          Menampilkan {startItem}-{endItem} dari {totalItems} transaksi
        </div>
        <div className="flex items-center gap-2">
          <span>Per halaman:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={value => onItemsPerPageChange(Number(value))}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={currentPage === 1}
            className="px-3 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Sebelumnya
          </Button>

          <div className="flex items-center gap-1 mx-2">
            {pageNumbers.map(pageNum => (
              <Fragment key={pageNum}>
                {pageNum === 1 && currentPage > 3 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(1)}
                      className="w-8 h-8 p-0"
                    >
                      1
                    </Button>
                    <div className="px-2">
                      <MoreHorizontal className="h-4 w-4" />
                    </div>
                  </>
                )}
                <Button
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
                {pageNum === totalPages && currentPage < totalPages - 2 && (
                  <>
                    <div className="px-2">
                      <MoreHorizontal className="h-4 w-4" />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(totalPages)}
                      className="w-8 h-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </Fragment>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={currentPage === totalPages}
            className="px-3 disabled:opacity-50"
          >
            Selanjutnya
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </CardFooter>
  );
};

export default TransactionPagination;
