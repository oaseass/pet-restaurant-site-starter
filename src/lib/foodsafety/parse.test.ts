import test from "node:test";
import assert from "node:assert/strict";
import { parseRestaurantsFromHtml } from "./parse";

test("parseRestaurantsFromHtml ignores header rows and keeps data rows", () => {
  const html = `
    <table>
      <tr>
        <th>연번</th>
        <th>업소명</th>
        <th>업종</th>
        <th>지역</th>
        <th>업소주소</th>
      </tr>
      <tr>
        <td>1</td>
        <td>테스트카페</td>
        <td>휴게음식점</td>
        <td>전북</td>
        <td>전북특별자치도 전주시 덕진구 기지로 91</td>
      </tr>
    </table>
  `;

  const rows = parseRestaurantsFromHtml(html);

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.name, "테스트카페");
  assert.equal(rows[0]?.businessType, "휴게음식점");
});
