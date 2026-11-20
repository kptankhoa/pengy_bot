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
    `🟡 VÀNG · ${price.name || 'SJC'}`,
    `Mua ${formatVnd(price.buy)}  ·  Bán ${formatVnd(price.sell)}`,
    ...(updatedAt ? [`🕘 ${new Date(updatedAt * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`] : [])
  ];
};

const getEconomicLines = async (apiKey: string): Promise<string[]> => {
  const headers = { Authorization: `Bearer ${apiKey}` };
  const [exchange, fuel, interest] = await Promise.all([
    fetchJson<ApiResponse<EconomicPrice>>('https://dulieu.dev/api/exchange?source=vietcombank.com.vn&limit=100', headers),
    fetchJson<ApiResponse<EconomicPrice>>('https://dulieu.dev/api/fuel?limit=100', headers),
    fetchJson<ApiResponse<EconomicPrice>>('https://dulieu.dev/api/interest/vnexpress?limit=500', headers)
  ]);

  const exchangeRows = exchange.data || [];
  const fuelRows = fuel.data || [];
  const interestRows = interest.data || [];
  const exchangeDate = exchange.meta?.updated_at || exchangeRows[0]?.date;
  const fuelDate = fuel.meta?.updated_at || fuelRows[0]?.date;
  const interestDate = interest.meta?.updated_at || interestRows[0]?.date;
  const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '';

  const lines = [
    '━━━━━━━━━━━━━━',
    '💱 TỶ GIÁ · VIETCOMBANK',
    'Mua tiền mặt / chuyển khoản / bán (VND)',
    ...formatExchangeRates(exchangeRows),
    ...(exchangeDate ? [`🗓 ${dateLabel(exchangeDate)}`] : []),
    '━━━━━━━━━━━━━━',
    '⛽ GIÁ XĂNG',
    ...formatFuelPrices(fuelRows),
    ...(fuelDate ? [`🗓 ${dateLabel(fuelDate)}`] : []),
    '━━━━━━━━━━━━━━',
    ...formatTopBankRates(interestRows),
    ...(interestDate ? [`🗓 ${dateLabel(interestDate)}`] : [])
  ];
  if (!exchangeRows.length && !fuelRows.length && !interestRows.length) {
    throw new Error('API không trả dữ liệu');
  }
  return lines;
};

const formatExchangeRates = (rows: EconomicPrice[]): string[] => {
  const currencies = [
    { code: 'USD', flag: '🇺🇸' },
    { code: 'EUR', flag: '🇪🇺' },
    { code: 'CNY', flag: '🇨🇳' },
    { code: 'JPY', flag: '🇯🇵' }
  ];
  return currencies.flatMap((currency) => {
    const row = rows.find((item) => item.currency?.toUpperCase() === currency.code);
    return row
      ? [`${currency.flag} ${currency.code}  ${formatVnd(row.buy)} / ${formatVnd(row.transfer)} / ${formatVnd(row.sell)}`]
      : [`${currency.flag} ${currency.code}  Chưa có dữ liệu`];
  });
};

const formatFuelPrices = (rows: EconomicPrice[]): string[] => {
  const fuelTypes = ['E5 RON 92', 'E10 RON 95-III'];
  return fuelTypes.flatMap((fuelType) => {
    const row = rows.find((item) => item.fuel_type?.toUpperCase().includes(fuelType));
    return row
      ? [`• ${fuelType}${row.zone ? ` · Vùng ${row.zone}` : ''}  ${formatVnd(row.price)}/lít`]
      : [`• ${fuelType}  Chưa có dữ liệu`];
  });
};

const formatTopBankRates = (rows: EconomicPrice[]): string[] => {
  const topRates = new Map<string, number>();
  rows.forEach((row) => {
    if (row.term_months !== 12 || !row.bank || typeof row.deposit_rate !== 'number') {
      return;
    }
    topRates.set(row.bank, Math.max(topRates.get(row.bank) ?? Number.NEGATIVE_INFINITY, row.deposit_rate));
  });

  const highestRates = [...topRates.entries()]
    .sort(([, rateA], [, rateB]) => rateB - rateA)
    .slice(0, 5);
  const formatRate = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

  return [
    '🏦 TOP 5 LÃI SUẤT · 12 THÁNG',
    ...(highestRates.length
      ? highestRates.map(([bank, rate], index) => `${['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index]} ${bank}  ${formatRate.format(rate)}%/năm`)
      : ['Chưa có dữ liệu'])
  ];
};

export const getPriceMessage = async (): Promise<string> => {
  const apiKey = process.env.DULIEU_API_KEY;
  const today = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const sections: string[] = [`📊 BẢNG GIÁ  ·  ${today}`];
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
      failures.push('tỷ giá, xăng và lãi suất ngân hàng');
    }
  } else {
    failures.push('tỷ giá, xăng và lãi suất ngân hàng (chưa cấu hình DULIEU_API_KEY)');
  }

  if (failures.length) {
    sections.push(`⚠️ Chưa lấy được: ${failures.join('; ')}.`);
  }
  sections.push('\nNguồn: vang.today · Vietcombank · DuLieu.dev');
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
