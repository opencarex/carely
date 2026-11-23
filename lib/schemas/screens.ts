export type Metric = {
  label: string;
  value: string;
  note?: string;
  tone?: "blue" | "sky" | "green" | "amber" | "red";
};

export type ListItem = {
  title: string;
  subtitle?: string;
  meta?: string;
  status?: string;
  href?: string;
};
