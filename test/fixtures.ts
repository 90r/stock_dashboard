export const KITA_ITEM_AMT_XML = `<?xml version='1.0' encoding='UTF-8'?>
<SHEET>
  <ETC-DATA><ETC KEY="totalCount">1</ETC></ETC-DATA>
  <DATA>
    <TR>
      <TD><![CDATA[1]]></TD><TD><![CDATA[8542321010]]></TD><TD><![CDATA[디램]]></TD><TD><![CDATA[U]]></TD>
      <TD><![CDATA[2,106,604,276]]></TD><TD><![CDATA[29.3]]></TD><TD><![CDATA[507686402]]></TD><TD><![CDATA[8.2]]></TD>
      <TD><![CDATA[1598917874]]></TD><TD><![CDATA[8012443877]]></TD><TD><![CDATA[280.3]]></TD><TD><![CDATA[1212665814]]></TD>
      <TD><![CDATA[138.9]]></TD><TD><![CDATA[6799778063]]></TD><TD><![CDATA[HS]]></TD><TD><![CDATA[2]]></TD>
    </TR>
  </DATA>
</SHEET>`;

export const KITA_ITEM_WGT_XML = `<?xml version='1.0' encoding='UTF-8'?>
<SHEET>
  <DATA>
    <TR>
      <TD><![CDATA[1]]></TD><TD><![CDATA[8542321010]]></TD><TD><![CDATA[디램]]></TD><TD><![CDATA[U]]></TD>
      <TD><![CDATA[148325]]></TD><TD><![CDATA[31.4]]></TD><TD><![CDATA[56744]]></TD><TD><![CDATA[-3.8]]></TD>
      <TD><![CDATA[91581.078]]></TD><TD><![CDATA[145289]]></TD><TD><![CDATA[-2]]></TD><TD><![CDATA[43959]]></TD>
      <TD><![CDATA[-22.5]]></TD><TD><![CDATA[101330]]></TD><TD><![CDATA[HS]]></TD><TD><![CDATA[2]]></TD>
    </TR>
  </DATA>
</SHEET>`;

export const KITA_DEST_AMT_XML = `<?xml version='1.0' encoding='UTF-8'?>
<SHEET>
  <DATA>
    <TR><TD></TD><TD></TD><TD><![CDATA[1]]></TD><TD><![CDATA[총계]]></TD><TD><![CDATA[1]]></TD><TD></TD><TD></TD><TD></TD><TD></TD><TD><![CDATA[3000]]></TD><TD></TD><TD><![CDATA[100]]></TD><TD></TD><TD></TD></TR>
    <TR><TD><![CDATA[1]]></TD><TD><![CDATA[TW]]></TD><TD><![CDATA[2]]></TD><TD><![CDATA[대만]]></TD><TD></TD><TD></TD><TD></TD><TD></TD><TD></TD><TD><![CDATA[2000]]></TD><TD></TD><TD><![CDATA[50]]></TD><TD></TD><TD></TD></TR>
    <TR><TD><![CDATA[2]]></TD><TD><![CDATA[HK]]></TD><TD><![CDATA[2]]></TD><TD><![CDATA[홍콩]]></TD><TD></TD><TD></TD><TD></TD><TD></TD><TD></TD><TD><![CDATA[1000]]></TD><TD></TD><TD><![CDATA[50]]></TD><TD></TD><TD></TD></TR>
  </DATA>
</SHEET>`;

export const KITA_DEST_WGT_XML = `<?xml version='1.0' encoding='UTF-8'?>
<SHEET>
  <DATA>
    <TR><TD><![CDATA[1]]></TD><TD><![CDATA[TW]]></TD><TD><![CDATA[2]]></TD><TD><![CDATA[대만]]></TD><TD></TD><TD></TD><TD></TD><TD></TD><TD></TD><TD><![CDATA[4]]></TD><TD></TD><TD><![CDATA[2]]></TD><TD></TD><TD></TD></TR>
    <TR><TD><![CDATA[2]]></TD><TD><![CDATA[HK]]></TD><TD><![CDATA[2]]></TD><TD><![CDATA[홍콩]]></TD><TD></TD><TD></TD><TD></TD><TD></TD><TD></TD><TD><![CDATA[1]]></TD><TD></TD><TD><![CDATA[1]]></TD><TD></TD><TD></TD></TR>
  </DATA>
</SHEET>`;

export const NAVER_HTML = `<html><body>
<table class="type2">
<tr><th>날짜</th><th>종가</th><th>전일비</th><th>시가</th><th>고가</th><th>저가</th><th>거래량</th></tr>
<tr><td align="center"><span>2026.03.29</span></td><td class="num"><span>180,000</span></td><td></td><td></td><td></td><td></td><td class="num"><span>1,100</span></td></tr>
<tr><td align="center"><span>2026.03.28</span></td><td class="num"><span>170,000</span></td><td></td><td></td><td></td><td></td><td class="num"><span>900</span></td></tr>
<tr><td align="center"><span>2026.02.28</span></td><td class="num"><span>150,000</span></td><td></td><td></td><td></td><td></td><td class="num"><span>800</span></td></tr>
</table>
</body></html>`;

export const FRANKFURTER_EXCHANGE_RATE_JSON = JSON.stringify([
  { date: "2026-03-29", base: "USD", quote: "CNY", rate: 6.87 },
  { date: "2026-03-29", base: "USD", quote: "KRW", rate: 1474.215 },
  { date: "2026-03-31", base: "USD", quote: "CNY", rate: 6.8628 },
  { date: "2026-03-31", base: "USD", quote: "KRW", rate: 1489.845252 },
  { date: "2026-02-28", base: "USD", quote: "CNY", rate: 6.82 },
  { date: "2026-02-28", base: "USD", quote: "KRW", rate: 1432.2 }
]);

export const TRADESMART_IPO_HTML = `<html><body><script>self.__next_f=self.__next_f||[];self.__next_f.push([1,"19:[\\"$\\",\\"$L1a\\",null,{\\"locale\\":\\"zh\\",\\"data\\":{\\"generated_at\\":\\"2026-05-22T16:25:03.821Z\\",\\"generated_at_utc\\":\\"2026-05-22T16:25:03.821Z\\",\\"source\\":\\"AAStocks HK IPO Calendar\\",\\"source_url\\":\\"http://www.aastocks.com/tc/stocks/market/ipo/ipocalendar.aspx\\",\\"timezone\\":\\"Asia/Hong_Kong\\",\\"grid\\":{\\"start_date\\":\\"2026-05-16\\",\\"end_date\\":\\"2026-05-30\\",\\"dates\\":[\\"2026-05-16\\",\\"2026-05-17\\"]},\\"event_legend\\":{\\"O\\":{\\"zh\\":\\"招股开始\\"}},\\"ipos\\":[{\\"symbol\\":\\"03310\\",\\"symbol_hk\\":\\"03310.HK\\",\\"name\\":\\"雲英谷科技\\",\\"subscription_open\\":\\"2026-05-18\\",\\"subscription_close\\":\\"2026-05-21\\",\\"price_fixed_date\\":\\"2026-05-18\\",\\"allotment_date\\":\\"2026-05-26\\",\\"listing_date\\":\\"2026-05-27\\",\\"listing_label\\":\\"4日後上市\\",\\"events\\":[{\\"date\\":\\"2026-05-18\\",\\"code\\":\\"O,F\\",\\"label\\":\\"O,F\\"}],\\"aastocks_url\\":\\"http://www.aastocks.com/tc/stocks/market/ipo/upcomingipo/company-summary?symbol=03310\\",\\"offer_price_hkd\\":20.81,\\"offer_price_range\\":null,\\"lot_size\\":200,\\"entry_fee_hkd\\":4203.98}],\\"count\\":1,\\"margin\\":{\\"generated_at\\":\\"2026-05-22T16:24:58.634Z\\",\\"source\\":\\"AiPO (myiqdii.com)\\",\\"source_url\\":\\"https://aipo.myiqdii.com/trasaction/index\\",\\"count\\":1,\\"records\\":[{\\"symbol\\":\\"03310\\",\\"symbol_hk\\":\\"03310.HK\\",\\"name\\":\\"云英谷科技\\",\\"margin_total_hkd_yi\\":4563.21765,\\"oversubscription_ratio\\":4146.81,\\"broker_top_text\\":\\"辉立证券: 401亿\\",\\"observed_at\\":\\"2026-05-21T03:48:15.000Z\\",\\"scraped_at\\":\\"2026-05-21T04:05:39.469Z\\",\\"source_url\\":\\"https://aipo.myiqdii.com/Trasaction/MarginDetails?symbol=03310\\"}]}}}]"])</script></body></html>`;

export const IPOSEEK_NEW_STOCK_JSON = JSON.stringify({
  rows: [
    {
      sequenceNo: 1,
      id: 108393,
      projectId: 1003995,
      shareCode: "301669",
      shareName: "高特电子",
      place: "深交所",
      board: "创业板",
      companyChineseName: "杭州高特电子设备股份有限公司",
      issuanceStartDate: "2026-05-21",
      pricingMechanism: "询价发行",
      issuanceStatus: "启动发行",
      listDate: null,
      issuancePrice: "-",
      issuanceNumber: "-",
      strategicPlacementNumber: "-",
      peRatio: "-",
      totalProceeds: "-",
      issuanceCosts: "-",
      sponsorshipFee: "-",
      auditFee: "-",
      lawyerFee: "-",
      disclosureFee: "-",
      processingFee: "-",
      auditDays: 226,
      registrationValidDate: "2026-02-04",
      issuanceCostsRatio: "-",
      sponsorshipFeeRatio: "-",
      auditFeeRatio: "-",
      lawyerFeeRatio: "-",
      disclosureFeeRatio: "-",
      processingFeeRatio: "-",
      sponsor: null,
      accountingFirm: null,
      lawFirm: null
    },
    {
      sequenceNo: 2,
      id: 103774,
      projectId: 1003978,
      shareCode: "001237",
      shareName: "惠康科技",
      place: "深交所",
      board: "主板",
      companyChineseName: "宁波惠康工业科技股份有限公司",
      issuanceStartDate: "2026-04-30",
      pricingMechanism: "询价发行",
      issuanceStatus: "发行成功",
      listDate: "2026-05-22",
      issuancePrice: "53.26",
      issuanceNumber: "3,708.79",
      strategicPlacementNumber: "0.00",
      peRatio: "21.04",
      totalProceeds: "197,529.93",
      issuanceCosts: "16,919.15",
      sponsorshipFee: "13,018.34",
      auditFee: "2,225.00",
      lawyerFee: "1,071.70",
      disclosureFee: "541.98",
      processingFee: "62.13",
      auditDays: 286,
      registrationValidDate: "2026-03-25",
      issuanceCostsRatio: "8.57%",
      sponsorshipFeeRatio: "6.59%",
      auditFeeRatio: "1.13%",
      lawyerFeeRatio: "0.54%",
      disclosureFeeRatio: "0.27%",
      processingFeeRatio: "0.03%",
      sponsor: null,
      accountingFirm: null,
      lawFirm: null
    }
  ],
  total: 1644
});

export const IPOSEEK_BOARD_COUNTS_JSON = JSON.stringify({ 北证: 316, 科创板: 612, 主板: 113, 创业板: 600 });
export const IPOSEEK_STATUS_COUNTS_JSON = JSON.stringify({ 启动发行: 2, 发行失败: 2, 发行成功: 1640 });
