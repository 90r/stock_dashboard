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
