import { FIRST_PAGE_NUMBER, RECORDS_PER_PAGE_OPTIONS } from "@/lib/Constants"
import { SetStateAction } from "react"

interface PationationProps {
  currentPage: number
  recordsPerPage: number
  totalRecordsCount: number
  setCurrentPage: (page: SetStateAction<number>) => void
  setRecordsPerPage: (perPage: number) => void
}

export default function Pagination({ currentPage, recordsPerPage, totalRecordsCount, setCurrentPage, setRecordsPerPage }: PationationProps) {
    const handlePrevPage = () => {
        setCurrentPage(current => Math.max(FIRST_PAGE_NUMBER, current - 1))
    }

    const handleNextPage = () => {
        setCurrentPage(current => current + 1)
    }

    const getTotalPages = Math.ceil(totalRecordsCount / recordsPerPage)
    
    return (
        <>
        <div className='w-full mt-16 mb-3' style={{height: '0.5px', backgroundColor: '#7393B3'}}></div>
        <div className='w-full flex justify-end'>
          <div className='w-1/5'>
            <span className='px-2'>Records per page:</span>
            <select
              value={recordsPerPage}
              onChange={(e) => { 
                setCurrentPage(FIRST_PAGE_NUMBER)
                setRecordsPerPage(parseInt(e.target.value))
              }}
              style={{color: 'blue'}}
            >
              {RECORDS_PER_PAGE_OPTIONS.map(perPage => (
                <option key={perPage} value={perPage}>
                  {perPage}
                </option>
              ))}
            </select>
          </div>
          <div className='w-1/4 flex justify-end'>
            <button className={currentPage > 1 ? 'text-primary-600 hover:text-primary-900' : ''} onClick={handlePrevPage} disabled={currentPage <= 1}>
              <u>Previous</u>
            </button>
            <span className="mx-2"><b>{currentPage}</b>/{getTotalPages} pages </span>
            <button className={currentPage < getTotalPages ? 'text-primary-600 hover:text-primary-900' : ''} onClick={handleNextPage} disabled={currentPage >= getTotalPages}>
              <u>Next</u>
            </button>
          </div>
        </div>
        </>
    )
}