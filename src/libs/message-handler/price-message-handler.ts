import { BOT_COMMAND } from 'const/chat';
import { Message } from 'models';

type ApiResponse<T> = {
  data?: T[];
  meta?: { updated_at?: string; source?: string };
};

type GoldPrice = {
  type_code?: string;
  type?: string;
  name?: string;
  buy?: number;
  sell?: number;
  update_time?: number;
};

type GoldResponse = GoldPrice & {
  success?: boolean;
  timestamp?: number;
  current_time?: number;
  data?: GoldPrice | GoldPrice[];
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
  bank?: string;
  term_months?: number;
  deposit_rate?: number;
  lending_rate?: number;
  channel?: string | null;
};

type CryptoPriceResponse = {
  bitcoin?: { vnd?: number };
  ethereum?: { vnd?: number };
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
  const response = await fetchJson<GoldResponse>(
    'https://www.vang.today/api/prices?type=SJL1L10'
  );
  const data = response.data ?? response;
  const price = Array.isArray(data) ? data[0] : data;
  if (!response.success || !price) {
    throw new Error('Không có dữ liệu');
  }
  const updatedAt = price.update_time || response.timestamp || response.current_time;
  return [
    `🟡 ${price.name || 'Vàng SJC'}: mua ${formatVnd(price.buy)} / bán ${formatVnd(price.sell)}`,
    ...(updatedAt ? [`   Cập nhật: ${new Date(updatedAt * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`] : [])
  ];
};

const getEconomicLines = async (apiKey: string): Promise<string[]> => {
  const headers = { Authorization: `Bearer ${apiKey}` };
  const [fuel, interest] = await Promise.all([
    fetchJson<ApiResponse<EconomicPrice>>('https://dulieu.dev/api/fuel?limit=100', headers),
    fetchJson<ApiResponse<EconomicPrice>>('https://dulieu.dev/api/interest/vnexpress?limit=500', headers)
  ]);

  const fuelRows = fuel.data || [];
  const interestRows = interest.data || [];
  const fuelDate = fuel.meta?.updated_at || fuelRows[0]?.date;
  const interestDate = interest.meta?.updated_at || interestRows[0]?.date;
  const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '';

  const lines = [
    '⛽ Giá xăng dầu:',
    ...fuelRows.slice(0, 6).map((row) => `⛽ ${row.fuel_type || 'Xăng dầu'}${row.zone ? ` (vùng ${row.zone})` : ''}: ${formatVnd(row.price)}/lít`),
    ...(fuelDate ? [`   Cập nhật: ${dateLabel(fuelDate)}`] : []),
    '🏦 Lãi suất tiết kiệm:',
    ...formatInterestRates(interestRows),
    ...(interestDate ? [`   Cập nhật: ${dateLabel(interestDate)}`] : [])
  ];
  if (!fuelRows.length && !interestRows.length) {
    throw new Error('API không trả dữ liệu');
  }
  return lines;
};

const formatInterestRates = (rows: EconomicPrice[]): string[] => {
  const banks = [...new Set(rows.map((row) => row.bank).filter((bank): bank is string => Boolean(bank)))];
  return banks.flatMap((bankName) => {
    const bankRows = rows.filter((row) => row.bank === bankName);
    const rates = [...new Set(bankRows.map((row) => row.term_months).filter((term): term is number => term != null))]
      .sort((a, b) => a - b)
      .flatMap((term) => {
        const row = bankRows.find((item) => item.term_months === term && item.deposit_rate != null);
        return row?.deposit_rate != null ? [`${term}T ${row.deposit_rate}%`] : [];
      });
    return rates.length ? [`🏦 ${bankName}: ${rates.join(' · ')}`] : [];
  });
};

const getCryptoLines = async (): Promise<string[]> => {
  const data = await fetchJson<CryptoPriceResponse>(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=vnd'
  );
  if (!data.bitcoin?.vnd && !data.ethereum?.vnd) {
    throw new Error('API không trả dữ liệu');
  }
  return [
    `₿ Bitcoin: ${formatVnd(data.bitcoin?.vnd)}`,
    `♦ Ethereum (ETH): ${formatVnd(data.ethereum?.vnd)}`
  ];
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
      failures.push('xăng và lãi suất ngân hàng');
    }
  } else {
    failures.push('xăng và lãi suất ngân hàng (chưa cấu hình DULIEU_API_KEY)');
  }

  try {
    sections.push(...await getCryptoLines());
  } catch (error) {
    console.error('Crypto price API failed', error);
    failures.push('Bitcoin và ETH');
  }

  if (failures.length) {
    sections.push(`⚠️ Chưa lấy được: ${failures.join('; ')}.`);
  }
  sections.push('\nNguồn: vang.today, DuLieu.dev, CoinGecko. Giá có thể không cập nhật theo thời gian thực.');
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
