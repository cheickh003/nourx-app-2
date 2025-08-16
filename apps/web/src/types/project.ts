
export interface Project {
  id: string;
  title: string;
  client: string; // client ID
  client_name?: string;
  status: string;
  progress: number;
  start_date?: string;
  end_date?: string;
}
