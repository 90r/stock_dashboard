export const CATEGORIES = [
  {
    id: "dram",
    label: "DRAM",
    shortLabel: "DRAM",
    hskCode: "8542321010",
    description: "HSK 8542321010"
  },
  {
    id: "mcp_hbm",
    label: "MCP / HBM proxy",
    shortLabel: "MCP-HBM",
    hskCode: "8542323000",
    description: "HSK 8542323000"
  },
  {
    id: "nand",
    label: "NAND / Flash",
    shortLabel: "NAND",
    hskCode: "8542321030",
    description: "HSK 8542321030"
  }
] as const;

export const STOCKS = [
  { symbol: "000660", company: "SK hynix", naverCode: "000660" },
  { symbol: "005930", company: "Samsung Electronics", naverCode: "005930" }
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export type StockSymbol = (typeof STOCKS)[number]["symbol"];
