export const formatDate = (date: string | Date, format: string = "DD MMM YYYY") => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
};

export const getYear = (date: string | Date) => {
    if (!date) return "-";
    return new Date(date).getFullYear().toString();
};

export const formatSnakeCase = (str: string) => {
    if (!str) return "-";
    return str.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};
