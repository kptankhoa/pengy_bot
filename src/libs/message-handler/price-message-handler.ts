import { BOT_COMMAND } from 'const/chat';
import { Message } from 'models';

type ApiResponse<T> = {
  data?: T[];
  meta?: { updated_at?: string; source?: string };
};

type GoldPrice = {
  type_code?: string;
  buy?: number;
  sell?: number;
  update_time?: number;
};

type EconomicPrice = {
  date?: string;
  currency?: string;
  buy?: number;
  sell?: number;
  transfer?: number;
  type?: string;
  fuel_type?: string;
  zone?: number;
  price?: number;
  buy_price?: number;
  sell_price?: number;
  unit?: string;
};

const formatVnd = (value?: number) => typeof value === 'number'
  ? `${new Intl.NumberFormat('vi-VN').format(value)} đ`
  : '—';

const fetchJson = async <T>(url: string, headers?: HeadersInit): Promise<T> => {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json<T>();
};

const getGoldLines = async (): Promise<string[]> => {
  const response = await fetchJson<{ success?: boolean; current_time?: number; data?: GoldPrice[] }>(
    'https://www.vang.today/api/prices?type=SJL1L10'
  );
  const price = response.data?.[0];
  if (!response.success || !price) {
    throw new Error('Không có dữ liệu');
  }
  const updatedAt = price.update_time || response.current_time;
  return [
    `🟡 Vàng SJC: mua ${formatVnd(price.buy)} / bán ${formatVnd(price.sell)}`,
    ...(updatedAt ? [`   Cập nhật: ${new Date(updatedAt * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`] : [])
  ];
};

const getEconomicLines = async (apiKey: string): Promise<string[]> => {
  const headers = { Authorization: `Bearer ${apiKey}` };
  const [exchange, silver, fuel] = await Promise.all([
    fetchJson<ApiResponse<EconomicPrice>>('https://dulieu.dev/api/exchange?limit=100', headers),
    fetchJson<ApiResponse<EconomicPrice>>('https://dulieu.dev/api/silver?limit=100', headers),
    fetchJson<ApiResponse<EconomicPrice>>('https://dulieu.dev/api/fuel?limit=100', headers)
  ]);

  const usd = exchange.data?.find((row) => row.currency?.toUpperCase() === 'USD');
  const silverRows = silver.data || [];
  const fuelRows = fuel.data || [];
  const silverDate = silver.meta?.updated_at || silverRows[0]?.date;
  const fuelDate = fuel.meta?.updated_at || fuelRows[0]?.date;
  const usdDate = exchange.meta?.updated_at || exchange.data?.[0]?.date;
  const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '';

  const lines = [
    `💱 USD/VND (Vietcombank): mua ${formatVnd(usd?.buy)} / bán ${formatVnd(usd?.sell)}`,
    ...(usdDate ? [`   Cập nhật: ${dateLabel(usdDate)}`] : []),
    ...silverRows.slice(0, 4).map((row) => `⚪ ${row.type || 'Bạc'}: mua ${formatVnd(row.buy_price)} / bán ${formatVnd(row.sell_price)}${row.unit ? ` / ${row.unit}` : ''}`),
    ...(silverDate ? [`   Cập nhật: ${dateLabel(silverDate)}`] : []),
    ...fuelRows.slice(0, 6).map((row) => `⛽ ${row.fuel_type || 'Xăng dầu'}${row.zone ? ` (vùng ${row.zone})` : ''}: ${formatVnd(row.price)}/lít`),
    ...(fuelDate ? [`   Cập nhật: ${dateLabel(fuelDate)}`] : [])
  ];
  if (!usd && !silverRows.length && !fuelRows.length) {
    throw new Error('API không trả dữ liệu');
  }
  return lines;
};

export const getPriceMessage = async (): Promise<string> => {
  const apiKey = process.env.DULIEU_API_KEY;
  const sections: string[] = [];
  const failures: string[] = [];

  try {
    sections.push(...await getGoldLines());
  } catch (error) {
    console.error('Gold price API failed', error);
    failures.push('vàng');
  }

  if (apiKey) {
    try {
      sections.push(...await getEconomicLines(apiKey));
    } catch (error) {
      console.error('DuLieu.dev API failed', error);
      failures.push('bạc, xăng và tỷ giá');
    }
  } else {
    failures.push('bạc, xăng và tỷ giá (chưa cấu hình DULIEU_API_KEY)');
  }

  if (failures.length) {
    sections.push(`⚠️ Chưa lấy được: ${failures.join('; ')}.`);
  }
  sections.push('\nNguồn: vang.today, DuLieu.dev. Giá có thể không cập nhật theo thời gian thực.');
  return sections.join('\n');
};

export const onPriceMessage = async (bot: any, msg: Message) => {
  const chatId = msg.chat.id;
  if (!BOT_COMMAND.PRICE.test(msg.text)) {
    return;
  }
  const reply = await getPriceMessage();
  await bot.sendMessage(chatId, reply, { reply_to_message_id: msg.message_id });
};
