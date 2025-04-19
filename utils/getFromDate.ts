import dayjs from "dayjs"

export function getFromDate(dateRange?: string): Date | undefined {
    if (!dateRange || dateRange === "all") return undefined;
  
    const now = dayjs();
  
    switch (dateRange) {
      case "30":
        return now.subtract(30, "day").toDate();
      case "90":
        return now.subtract(90, "day").toDate();
      case "180":
        return now.subtract(180, "day").toDate();
      case "ytd":
        return now.startOf("year").toDate();
      default:
        return undefined; // Fallback to no filter
    }
  }