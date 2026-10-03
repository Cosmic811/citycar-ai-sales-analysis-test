type Lead = {
  id: number;
  name: string;
  responsible_user_id: number;
  closest_task_at: number | null;
};

const baseUrl = `https://${process.env.AMO_SUBDOMAIN}.amocrm.ru`;
const token = process.env.AMO_ACCESS_TOKEN!;
const now = Math.floor(Date.now() / 1000);
const from = now - 30 * 24 * 60 * 60;

async function getProblemLeads() {
  const problemLeads: Array<Lead & { issue: string }> = [];

  for (let page = 1; ; page++) {
    const url = new URL(`${baseUrl}/api/v4/leads`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", "250");
    url.searchParams.set("filter[updated_at][from]", String(from));

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`amoCRM ${response.status}`);

    const data = await response.json();
    const leads: Lead[] = data._embedded?.leads ?? [];

    for (const lead of leads) {
      if (lead.closest_task_at === null || lead.closest_task_at < now) {
        problemLeads.push({
          ...lead,
          issue: lead.closest_task_at === null ? "no_task" : "overdue_task",
        });
      }
    }

    if (!data._links?.next) break;
  }

  return problemLeads;
}

getProblemLeads().then(console.table).catch(console.error);
