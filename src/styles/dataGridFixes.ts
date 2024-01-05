/**
 * add to sx on DataGrid in order to fix choppy resize animations with many rows in DataGrid
 */
export const DataGridResizeAnimationFixes = {
  '& .MuiDataGrid-main': {
    width: 0,
    minWidth: '100%',
  },
};

/**
 * add to sx on DataGrid in order to ensure the scrollbar is properly displayed
 */
export const DataGridScrollbarDisplayFix = {
  '.MuiTablePagination-root::-webkit-scrollbar': {
    width: 0,
  },
};

export const DataGridSetMinRowHeightToDefault = {
  '.MuiDataGrid-cell': {
    minHeight: '52px !important',
  },
};
