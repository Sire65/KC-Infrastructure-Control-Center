import { test, expect } from '@playwright/test';

test.describe('KICC DB Security TÜV · read-only guard',()=>{
  test('Remote SQL allowlist contains only read-only queries',async({page})=>{
    await page.goto('/?e2e=1#databases',{waitUntil:'domcontentloaded'});
    const result=await page.evaluate(async()=>{
      const m=await import('/database/db-security-readonly.js');
      return Object.keys(m.validateSecurityQuerySet());
    });
    expect(result.length).toBeGreaterThanOrEqual(6);
  });

  test('Destructive SQL is hard blocked',async({page})=>{
    await page.goto('/?e2e=1#databases',{waitUntil:'domcontentloaded'});
    const blocked=await page.evaluate(async()=>{
      const m=await import('/database/db-security-readonly.js');
      const bad=['DELETE FROM x','UPDATE x SET a=1','DROP TABLE x','ALTER TABLE x ADD COLUMN y int','TRUNCATE x','CREATE TABLE x(a int)','GRANT ALL ON x TO PUBLIC','VACUUM','EXPLAIN ANALYZE DELETE FROM x'];
      return bad.every(sql=>{try{m.assertReadOnlySql(sql);return false;}catch{return true;}});
    });
    expect(blocked).toBe(true);
  });

  test('IndexedDB security probe reports read-only mode and current-origin scope',async({page})=>{
    await page.goto('/?e2e=1#databases',{waitUntil:'domcontentloaded'});
    const result=await page.evaluate(async()=>{
      const m=await import('/database/db-security-readonly.js');
      return await m.probeIndexedDbSecurity();
    });
    expect(result.scope).toBe('CURRENT_ORIGIN_ONLY');
    expect(result.readOnly===true||result.status==='DEGRADED').toBe(true);
    for(const db of result.databases||[]) expect(db.readOnly).toBe(true);
  });

  test('Encryption-shape detector never returns record values',async({page})=>{
    await page.goto('/?e2e=1#databases',{waitUntil:'domcontentloaded'});
    const result=await page.evaluate(async()=>{
      const m=await import('/database/db-security-readonly.js');
      return m.classifyRecordShape({ciphertext:'SECRET-CIPHERTEXT',iv:'123',tag:'456'});
    });
    expect(result.encryptedEnvelope).toBe(true);
    expect(JSON.stringify(result)).not.toContain('SECRET-CIPHERTEXT');
  });
});
