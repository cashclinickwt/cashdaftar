/* Cash Daftar — app (ES module, no build step)
   Firebase modular SDK from gstatic (same as the Cash Clinic site). All writes go through Cloud Functions. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, onSnapshot, getDocs, query, where, orderBy, limit, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

const CFG = window.CD_CONFIG;
const app = initializeApp(CFG.firebase);
const auth = getAuth(app);
const db = getFirestore(app);
const fns = getFunctions(app, CFG.functionsRegion);
const call = async (name, data) => { try { return (await httpsCallable(fns, name)(data || {})).data; } catch (e) { throw new Error((e && e.message) || "خطأ"); } };

/* ---------------- i18n ---------------- */
const LANG_KEY = "cc-lang"; // shared with the landing page (i18n.js)
let LANG = (localStorage.getItem(LANG_KEY) === "en") ? "en" : "ar";
const T = {
  app:["كاش دفتر","Cash Daftar"], by:["من كاش كلينك","by Cash Clinic"],
  login:["تسجيل الدخول","Sign in"], signup:["حساب جديد","Create account"], reset:["نسيت كلمة المرور","Forgot password"],
  email:["الإيميل","Email"], password:["كلمة المرور","Password"], name:["الاسم","Name"], sendReset:["أرسل رابط الاستعادة","Send reset link"],
  resetSent:["تم إرسال الرابط إلى إيميلك","Reset link sent"], signout:["خروج","Sign out"],
  onbTitle:["أنشئ دفتر شركتك","Set up your company"], onbSub:["دقيقة وحدة وتبدأ التسجيل. تقدر تعدّل كل شي لاحقاً من الإعدادات.","One minute and you're in. Everything can be edited later in Settings."],
  coName:["اسم الشركة / المشروع","Company / project name"], crNumber:["رقم السجل التجاري / الرخصة","CR / licence number"], activity:["النشاط","Activity"],
  phone:["الهاتف","Phone"], fy:["شهر بداية السنة المالية","Fiscal year starts in"], create:["إنشاء الدفتر","Create ledger"],
  home:["الرئيسية","Home"], ledger:["الدفتر","Ledger"], journal:["القيود اليومية","Journal"], accounts:["دليل الحسابات","Chart of accounts"],
  sales:["المبيعات","Sales"], contacts:["العملاء والموردون","Customers & suppliers"], invoices:["الفواتير","Invoices"], receipts:["سندات القبض","Receipts"], orders:["الطلبات","Orders"],
  spending:["المصروفات","Spending"], expenses:["المصروفات","Expenses"], payments:["الصرف للموردين","Supplier payments"],
  costing:["المنتجات والتكلفة","Products & costing"], materials:["المواد الأولية","Raw materials"], products:["المنتجات","Products"], campaigns:["الحملات والمعارض","Campaigns & exhibitions"],
  reportsG:["التقارير","Reports"], reports:["التقارير المالية","Financial reports"], xbrl:["الميزانية وتصدير XBRL","Year-end & XBRL export"],
  settingsG:["الإعدادات","Settings"], billing:["الاشتراك","Subscription"], settings:["إعدادات الشركة","Company settings"], admin:["لوحة كاش كلينك","Cash Clinic admin"],
  trial:["تجريبي","Trial"], active:["فعّال","Active"], expired:["منتهي","Expired"], until:["حتى","until"], readOnly:["الدفتر للقراءة فقط — جدّد الاشتراك لتكمل التسجيل","Read-only — renew to keep posting"], renew:["تجديد الاشتراك","Renew"],
  new:["جديد","New"], save:["حفظ","Save"], cancel:["إلغاء","Cancel"], edit:["تعديل","Edit"], delete:["حذف","Delete"], void:["إلغاء القيد","Void"], post:["ترحيل","Post"], close:["إغلاق","Close"],
  date:["التاريخ","Date"], dueDate:["تاريخ الاستحقاق","Due date"], memo:["البيان","Memo"], ref:["مرجع","Ref"], amount:["المبلغ","Amount"], total:["الإجمالي","Total"], subtotal:["المجموع","Subtotal"], discount:["الخصم","Discount"],
  debit:["مدين","Debit"], credit:["دائن","Credit"], account:["الحساب","Account"], number:["#","#"], status:["الحالة","Status"], actions:["","" ],
  customer:["العميل","Customer"], supplier:["المورد","Supplier"], type:["النوع","Type"], both:["عميل ومورد","Customer & supplier"], balance:["الرصيد","Balance"],
  desc:["الوصف","Description"], qty:["الكمية","Qty"], price:["السعر","Price"], lineTotal:["المبلغ","Amount"], addLine:["+ سطر","+ line"], notes:["ملاحظات","Notes"],
  paid:["مدفوع","Paid"], remaining:["المتبقي","Remaining"], open:["مفتوح","Open"], partial:["جزئي","Partial"], voidTag:["ملغي","Void"],
  paidFrom:["مدفوع من","Paid from"], onCredit:["آجل (على حساب المورد)","On credit (supplier account)"], expenseAccount:["حساب المصروف","Expense account"],
  toAccount:["إيداع في","Deposit to"], fromAccount:["صرف من","Pay from"], forInvoice:["عن فاتورة","For invoice"], forExpense:["عن مصروف","For expense"], noneInv:["بدون فاتورة (رصيد العميل)","No invoice (customer balance)"],
  asAdvance:["دفعة مقدمة (بدون فاتورة)","Advance payment (no invoice)"], method:["طريقة الدفع","Method"],
  unit:["الوحدة","Unit"], unitCost:["تكلفة الوحدة","Unit cost"], cost:["التكلفة","Cost"], margin:["هامش الربح","Margin"], marginPct:["نسبة الهامش","Margin %"], breakEvenPrice:["أقل سعر بدون خسارة","Break-even price"],
  costMode:["طريقة التكلفة","Cost method"], manualCost:["إدخال يدوي","Manual"], fromMaterials:["من المواد الأولية","From raw materials"], matQty:["الكمية لكل وحدة","Qty per unit"],
  channel:["قناة البيع","Channel"], campaign:["الحملة","Campaign"], isPaid:["تم القبض","Paid"], onAccount:["آجل — على حساب العميل","On account (customer balance)"], product:["المنتج","Product"],
  profit:["الربح","Profit"], breakEvenOrders:["طلبات التعادل","Break-even orders"], actualOrders:["الطلبات الفعلية","Actual orders"], revenue:["الإيرادات","Revenue"], roi:["العائد","ROI"],
  ad:["إعلان مشهور/ممول","Influencer / paid ad"], exhibition:["معرض","Exhibition"], store:["مشاركة بمحل","Store placement"], campaignCost:["تكلفة الحملة","Campaign cost"], avgOrderValue:["متوسط قيمة الطلب","Avg order value"], avgOrderCost:["متوسط تكلفة الطلب","Avg order cost"],
  from:["من","From"], to:["إلى","To"], apply:["عرض","Apply"], thisFY:["السنة المالية الحالية","This fiscal year"], thisMonth:["هذا الشهر","This month"],
  tb:["ميزان المراجعة","Trial balance"], pl:["قائمة الدخل","Profit & loss"], bs:["المركز المالي","Balance sheet"], monthly:["التقرير الشهري","Monthly report"], ledgerOf:["كشف حساب","Account ledger"], aging:["أرصدة العملاء والموردين","Receivables & payables"],
  assets:["الأصول","Assets"], liabilities:["الالتزامات","Liabilities"], equity:["حقوق الملكية","Equity"], netIncome:["صافي الربح (الخسارة)","Net profit (loss)"], cogs:["تكلفة المبيعات","Cost of sales"], grossProfit:["مجمل الربح","Gross profit"], opex:["المصروفات التشغيلية","Operating expenses"], otherIncome:["إيرادات أخرى","Other income"],
  cashIn:["مقبوضات","Cash in"], cashOut:["مدفوعات","Cash out"], cashNet:["صافي الحركة النقدية","Net cash movement"], cashBalance:["رصيد النقد والبنك","Cash & bank"],
  export:["تصدير Excel","Export Excel"], print:["طباعة","Print"],
  plansTitle:["اختر باقتك","Choose your plan"], monthlyPlan:["شهري","Monthly"], annualPlan:["سنوي","Annual"], perMonth:["د.ك / شهر","KWD / month"], perYear:["د.ك / سنة","KWD / year"], pay:["اشترك الآن","Subscribe now"], bestValue:["الأوفر","Best value"],
  planF1:["دفتر كامل: قيود، فواتير، مصروفات، قبض وصرف","Full ledger: journal, invoices, expenses, receipts & payments"], planF2:["تكلفة المنتجات وتحليل الحملات والمعارض","Product costing, campaign & exhibition analysis"], planF3:["التقارير المالية وتصدير XBRL","Financial reports and XBRL export"], planF4:["محاسب إضافي بصلاحية دخول","Extra accountant seat"],
  history:["سجل الدفعات","Payment history"], members:["الأعضاء","Members"], invite:["دعوة محاسب","Invite accountant"], role:["الصلاحية","Role"], owner:["مالك","Owner"], accountant:["محاسب","Accountant"], viewer:["مشاهدة","Viewer"], pending:["بانتظار التسجيل","Pending sign-up"], remove:["إزالة","Remove"],
  companies:["الشركات","Companies"], grantDays:["إضافة أيام","Add days"], setExpired:["إيقاف","Expire"], search:["بحث","Search"],
  todayInv:["فواتير مفتوحة","Open invoices"], recvBal:["مستحق من العملاء","Due from customers"], payBal:["مستحق للموردين","Due to suppliers"], monthRev:["إيرادات الشهر","Revenue this month"], monthExp:["مصروفات الشهر","Expenses this month"],
  quick:["إجراءات سريعة","Quick actions"], recent:["آخر القيود","Recent journal entries"], noData:["لا توجد بيانات بعد","Nothing here yet"],
  confirmVoid:["سيتم إنشاء قيد عكسي. سبب الإلغاء:","A reversing entry will be posted. Reason:"], confirmDel:["حذف السجل؟","Delete this record?"],
  sysAccount:["نظامي","System"], code:["الرمز","Code"], nameAr:["الاسم بالعربي","Arabic name"], nameEn:["الاسم بالإنجليزي","English name"], activeAcc:["فعّال","Active"], inactive:["موقوف","Inactive"],
  asset:["أصول","Asset"], liability:["التزامات","Liability"], equityT:["حقوق ملكية","Equity"], revenueT:["إيرادات","Revenue"], expense:["مصروفات","Expense"],
  saved:["تم الحفظ","Saved"], posted:["تم الترحيل","Posted"], voided:["تم الإلغاء","Voided"], deleted:["تم الحذف","Deleted"],
  xbrlNote:["يُصدّر ملف Excel بصيغة جاهزة لترحيل أرقامك إلى قالب XBRL (نظام قيّد). ورقة «Mapping» تربط كل حساب ببند القوائم ورمز التصنيف — عدّلها عند استلام القالب الرسمي.","Exports an Excel workbook ready for mapping into the XBRL (قيّد) template. The Mapping sheet links every account to a statement line and taxonomy element — adjust when the official template is supplied."],
  fyLabel:["السنة المالية","Fiscal year"], generate:["توليد الملف","Generate file"],
  opening:["رصيد افتتاحي / رأس مال","Opening balance / capital"], hintOpening:["سجّل رأس المال والأرصدة الافتتاحية بقيد يومي: مدين البنك أو الصندوق، دائن رأس المال.","Post opening balances as a journal entry: debit Bank/Cash, credit Owner's capital."],
  hintInventory:["لتكون تكلفة المبيعات صحيحة، سجّل شراء المواد الأولية على حساب «المخزون والمواد الأولية 1300».","For accurate cost of sales, book raw-material purchases to account 1300 Inventory."],
  needContact:["أضف عميلاً أولاً من صفحة العملاء والموردين","Add a customer first"], needSupplier:["أضف مورداً أولاً","Add a supplier first"],
  whatsapp:["واتساب كاش كلينك","Cash Clinic WhatsApp"],
};
const t = (k) => (T[k] ? T[k][LANG === "ar" ? 0 : 1] : k);
const isAr = () => LANG === "ar";

/* ---------------- helpers ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (x) => Math.round((Number(x) || 0) * 1000) / 1000;
const fmt = (n) => (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const fmt0 = (n) => (Number(n) || 0).toLocaleString("en-US");
const pct = (n) => (isFinite(n) ? (n * 100).toFixed(1) + "%" : "—");
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const monthKey = (d) => d.slice(0, 7);
function fyRange(startMonth) {
  const now = new Date(); const y = now.getFullYear(); const m = now.getMonth() + 1;
  const startY = m >= startMonth ? y : y - 1;
  const from = `${startY}-${String(startMonth).padStart(2, "0")}-01`;
  const endD = new Date(Date.UTC(startY + 1, startMonth - 1, 0));
  return { from, to: endD.toISOString().slice(0, 10) };
}
const accName = (a) => (isAr() ? a.nameAr : (a.nameEn || a.nameAr));
const accLabel = (a) => `${a.code} — ${accName(a)}`;
const typeLabel = (ty) => t({ asset: "asset", liability: "liability", equity: "equityT", revenue: "revenueT", expense: "expense" }[ty] || ty);

let toastTimer = null;
function toast(msg, isErr) { const el = $("#toast"); el.textContent = msg; el.style.background = isErr ? "#962E37" : ""; el.classList.add("on"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("on"), 3200); }
function openModal(html) { const m = $("#modal"); m.innerHTML = `<div class="mbox">${html}</div>`; m.classList.add("on"); $$('[data-close]', m).forEach((b) => b.addEventListener("click", closeModal)); return m; }
function closeModal() { const m = $("#modal"); m.classList.remove("on"); m.innerHTML = ""; }
const busy = (btn, on) => { if (!btn) return; btn.disabled = on; if (on) { btn.dataset.txt = btn.textContent; btn.textContent = "…"; } else if (btn.dataset.txt) btn.textContent = btn.dataset.txt; };
const opt = (v, label, sel) => `<option value="${esc(v)}" ${sel === v ? "selected" : ""}>${esc(label)}</option>`;

/* ---------------- state ---------------- */
const S = { user: null, company: null, member: null, isAdmin: false, plans: null, accounts: [], contacts: [], products: [], materials: [], campaigns: [], unsub: [], view: "home", ready: false };
const cid = () => S.company && S.company.id;
const canWrite = () => !!(S.company && S.company.subscription.active && S.member && ["owner", "accountant"].includes(S.member.role));
const isOwner = () => !!(S.member && S.member.role === "owner");
const accountsBy = (pred) => S.accounts.filter((a) => a.active !== false && pred(a));
const cashAccounts = () => accountsBy((a) => a.type === "asset" && ["cash", "bank"].includes(a.subtype));
const findAcc = (code) => S.accounts.find((a) => a.code === code);

/* ---------------- auth screens ---------------- */
function renderAuth(tab = "login") {
  document.body.innerHTML = `
  <div class="cd-screen"><div class="cd-card">
    <div class="cd-brand"><img src="assets/brand/daftar-mark.png" alt=""><div><div class="t"><b>Cash</b> <span>Daftar</span></div><div class="s">${t("by")} · كاش دفتر</div></div></div>
    <div class="tabs">
      <button data-tab="login" class="${tab === "login" ? "on" : ""}">${t("login")}</button>
      <button data-tab="signup" class="${tab === "signup" ? "on" : ""}">${t("signup")}</button>
    </div>
    <form id="authf">
      ${tab === "signup" ? `<div class="f"><label>${t("name")}</label><input name="name" required maxlength="120"></div>` : ""}
      <div class="f"><label>${t("email")}</label><input name="email" type="email" required autocomplete="email" dir="ltr"></div>
      ${tab !== "reset" ? `<div class="f"><label>${t("password")}</label><input name="password" type="password" required minlength="6" autocomplete="${tab === "signup" ? "new-password" : "current-password"}" dir="ltr"></div>` : ""}
      <div id="autherr"></div>
      <button class="btn btn-p btn-block" type="submit">${tab === "reset" ? t("sendReset") : t(tab)}</button>
    </form>
    <div style="display:flex;justify-content:space-between;margin-top:16px;font-size:13.5px">
      <a href="#" data-tab="reset">${t("reset")}</a>
      <a href="#" id="langbtn">${isAr() ? "English" : "العربية"}</a>
    </div>
    <div class="small muted" style="margin-top:18px;text-align:center">
      <a href="index.html">${isAr() ? "العودة للموقع" : "Back to site"}</a>
    </div>
  </div></div><div id="toast"></div>`;
  $$("[data-tab]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); renderAuth(b.dataset.tab); }));
  $("#langbtn").addEventListener("click", (e) => { e.preventDefault(); setLang(isAr() ? "en" : "ar"); renderAuth(tab); });
  $("#authf").addEventListener("submit", async (e) => {
    e.preventDefault(); const f = e.target; const btn = $("button[type=submit]", f); const err = $("#autherr"); err.innerHTML = "";
    const email = f.email.value.trim(); busy(btn, true);
    try {
      if (tab === "login") await signInWithEmailAndPassword(auth, email, f.password.value);
      else if (tab === "signup") { const cred = await createUserWithEmailAndPassword(auth, email, f.password.value); await updateProfile(cred.user, { displayName: f.name.value.trim() }); }
      else { await sendPasswordResetEmail(auth, email); err.innerHTML = `<div class="ok">${t("resetSent")}</div>`; }
    } catch (ex) {
      const code = (ex && ex.code) || "";
      const map = { "auth/invalid-credential": ["الإيميل أو كلمة المرور غير صحيحة", "Wrong email or password"], "auth/user-not-found": ["الحساب غير موجود", "Account not found"], "auth/email-already-in-use": ["الإيميل مسجل مسبقاً — سجّل الدخول", "Email already registered — sign in"], "auth/weak-password": ["كلمة المرور قصيرة (6 أحرف على الأقل)", "Password too short (min 6)"], "auth/invalid-email": ["إيميل غير صحيح", "Invalid email"], "auth/too-many-requests": ["محاولات كثيرة — جرّب بعد شوي", "Too many attempts — try later"] };
      const m = map[code]; err.innerHTML = `<div class="err">${m ? m[isAr() ? 0 : 1] : esc(ex.message)}</div>`;
    } finally { busy(btn, false); }
  });
}
function setLang(l) { LANG = l; localStorage.setItem(LANG_KEY, l); document.documentElement.setAttribute("dir", l === "ar" ? "rtl" : "ltr"); document.documentElement.setAttribute("lang", l); }

/* ---------------- onboarding ---------------- */
function renderOnboarding() {
  const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const monthsEn = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  document.body.innerHTML = `
  <div class="cd-screen"><div class="cd-card wide">
    <div class="cd-brand"><img src="assets/brand/daftar-mark.png" alt=""><div><div class="t"><b>Cash</b> <span>Daftar</span></div><div class="s">${esc(S.user.email)}</div></div></div>
    <h2 style="margin:0 0 6px;font-size:22px;color:var(--cc-purple);font-weight:500">${t("onbTitle")}</h2>
    <p class="muted" style="margin:0 0 20px;font-size:14.5px">${t("onbSub")}</p>
    <form id="onbf">
      <div class="f"><label>${t("coName")}</label><input name="name" required maxlength="120"></div>
      <div class="row">
        <div class="f"><label>${t("crNumber")}</label><input name="crNumber" maxlength="40" dir="ltr"></div>
        <div class="f"><label>${t("phone")}</label><input name="phone" maxlength="30" dir="ltr"></div>
      </div>
      <div class="row">
        <div class="f"><label>${t("activity")}</label><input name="activity" maxlength="120" placeholder="${isAr() ? "مثال: مشروع عطور، مقهى، متجر إلكتروني" : "e.g. perfume brand, café, online store"}"></div>
        <div class="f"><label>${t("fy")}</label><select name="fiscalYearStartMonth">${months.map((m, i) => opt(String(i + 1), isAr() ? m : monthsEn[i], "1")).join("")}</select></div>
      </div>
      <div id="onberr"></div>
      <button class="btn btn-g btn-block" type="submit">${t("create")}</button>
    </form>
    <div style="display:flex;justify-content:space-between;margin-top:16px;font-size:13.5px"><a href="#" id="so">${t("signout")}</a><a href="#" id="langbtn">${isAr() ? "English" : "العربية"}</a></div>
  </div></div><div id="toast"></div>`;
  $("#langbtn").addEventListener("click", (e) => { e.preventDefault(); setLang(isAr() ? "en" : "ar"); renderOnboarding(); });
  $("#so").addEventListener("click", (e) => { e.preventDefault(); signOut(auth); });
  $("#onbf").addEventListener("submit", async (e) => {
    e.preventDefault(); const f = e.target; const btn = $("button[type=submit]", f); busy(btn, true); $("#onberr").innerHTML = "";
    try {
      await call("createCompany", { name: f.name.value, crNumber: f.crNumber.value, phone: f.phone.value, activity: f.activity.value, fiscalYearStartMonth: Number(f.fiscalYearStartMonth.value), ownerName: S.user.name || auth.currentUser.displayName || "" });
      await boot();
    } catch (ex) { $("#onberr").innerHTML = `<div class="err">${esc(ex.message)}</div>`; busy(btn, false); }
  });
}

/* ---------------- boot ---------------- */
async function boot() {
  const b = await call("bootstrap");
  S.user = b.user; S.company = b.company; S.member = b.member; S.isAdmin = b.isAdmin; S.plans = b.plans;
  if (!S.company) { renderOnboarding(); return; }
  renderShell(); await subscribeMaster(); route();
}
onAuthStateChanged(auth, async (u) => {
  setLang(LANG);
  if (!u) { S.unsub.forEach((f) => f()); S.unsub = []; renderAuth("login"); return; }
  document.body.innerHTML = `<div class="cd-screen"><div class="muted">…</div></div>`;
  try { await boot(); } catch (e) { document.body.innerHTML = `<div class="cd-screen"><div class="cd-card"><div class="err">${esc(e.message)}</div><button class="btn btn-o" id="so">${t("signout")}</button></div></div>`; $("#so").addEventListener("click", () => signOut(auth)); }
});

/* ---------------- shell / nav / routing ---------------- */
const NAV = [
  { grp: null, items: [["home", "🏠"]] },
  { grp: "ledger", items: [["journal", "📒"], ["accounts", "🗂️"]] },
  { grp: "sales", items: [["contacts", "👥"], ["invoices", "🧾"], ["receipts", "💰"], ["orders", "🛍️"]] },
  { grp: "spending", items: [["expenses", "💸"], ["payments", "🏦"]] },
  { grp: "costing", items: [["materials", "🧱"], ["products", "📦"], ["campaigns", "📣"]] },
  { grp: "reportsG", items: [["reports", "📊"], ["xbrl", "📤"]] },
  { grp: "settingsG", items: [["billing", "💳"], ["settings", "⚙️"]] },
];
function renderShell() {
  const sub = S.company.subscription;
  document.body.innerHTML = `
  <div id="app">
    <aside class="sb" id="sb">
      <div class="logo"><img src="assets/brand/daftar-mark-light.png" alt=""><div class="t"><b>Cash</b> <span>Daftar</span></div></div>
      <div class="co"><b>${esc(S.company.name)}</b>${esc(S.company.crNumber || "")}</div>
      ${NAV.map((g) => `${g.grp ? `<div class="grp">${t(g.grp)}</div>` : ""}${g.items.map(([k, ic]) => `<a class="nl" href="#${k}" data-nav="${k}"><span class="ic">${ic}</span>${t(k)}</a>`).join("")}`).join("")}
      ${S.isAdmin ? `<div class="grp">Cash Clinic</div><a class="nl" href="#admin" data-nav="admin"><span class="ic">🛡️</span>${t("admin")}</a>` : ""}
      <div class="foot">
        <div class="u">${esc(S.user.email)} · ${t(S.member.role)}</div>
        <div class="lnk"><button id="langbtn">${isAr() ? "EN" : "ع"}</button><button id="so">${t("signout")}</button></div>
      </div>
    </aside>
    <main class="main">
      <header class="topbar">
        <div style="display:flex;align-items:center;gap:12px"><button class="burger" id="burger">☰</button><h1 id="ttl"></h1></div>
        <div class="acts" id="acts"><span class="pill ${sub.active ? (sub.status === "trial" ? "trial" : "active") : "expired"}">${sub.active ? `${t(sub.status === "trial" ? "trial" : "active")} · ${t("until")} ${sub.periodEnd ? sub.periodEnd.slice(0, 10) : ""}` : t("expired")}</span></div>
      </header>
      <div id="view"></div>
    </main>
  </div><div id="modal"></div><div id="toast"></div>`;
  $("#langbtn").addEventListener("click", () => { setLang(isAr() ? "en" : "ar"); renderShell(); route(); });
  $("#so").addEventListener("click", () => signOut(auth));
  $("#burger").addEventListener("click", () => $("#sb").classList.toggle("open"));
  $$("[data-nav]").forEach((a) => a.addEventListener("click", () => $("#sb").classList.remove("open")));
  window.removeEventListener("hashchange", route); window.addEventListener("hashchange", route);
}
async function refreshCompany() { const b = await call("bootstrap"); S.company = b.company; S.member = b.member; S.plans = b.plans; renderShell(); route(); }

const VIEWS = {};
function route() {
  const k = (location.hash || "#home").slice(1).split("?")[0];
  S.view = VIEWS[k] ? k : "home";
  $$("[data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === S.view));
  $("#ttl").textContent = t(S.view);
  const v = $("#view");
  v.innerHTML = (!S.company.subscription.active ? `<div class="banner"><div>⚠️ ${t("readOnly")}</div><a class="btn btn-g btn-s" href="#billing">${t("renew")}</a></div>` : "") + `<div id="vbody"><div class="empty">…</div></div>`;
  Promise.resolve(VIEWS[S.view]($("#vbody"))).catch((e) => { $("#vbody").innerHTML = `<div class="err">${esc(e.message)}</div>`; });
}
let rerenderTimer = null;
function rerenderIf(...keys) { if (!S.ready || !keys.includes(S.view)) return; clearTimeout(rerenderTimer); rerenderTimer = setTimeout(route, 80); }

/* ---------------- master data (live) ---------------- */
/* resolves after every collection has delivered its first snapshot, so the first render has contacts/accounts/products in hand */
function subscribeMaster() {
  S.unsub.forEach((f) => f()); S.unsub = []; S.ready = false;
  const firsts = [];
  const live = (name, key, sortFn) => {
    let first; firsts.push(new Promise((res) => { first = res; }));
    S.unsub.push(onSnapshot(collection(db, `companies/${cid()}/${name}`), (snap) => {
      S[key] = snap.docs.map((d) => ({ id: d.id, ...d.data() })); if (sortFn) S[key].sort(sortFn);
      first();
      rerenderIf(name, "home", "products", "campaigns", "journal", "invoices", "expenses", "receipts", "payments", "orders");
    }, (err) => { console.error(name, err); first(); }));
  };
  live("accounts", "accounts", (a, b) => a.code.localeCompare(b.code));
  live("contacts", "contacts", (a, b) => a.name.localeCompare(b.name));
  live("products", "products", (a, b) => a.name.localeCompare(b.name));
  live("materials", "materials", (a, b) => a.name.localeCompare(b.name));
  live("campaigns", "campaigns", (a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
  return Promise.all(firsts).then(() => { S.ready = true; });
}
async function loadDocs(name, opts = {}) {
  const parts = [collection(db, `companies/${cid()}/${name}`)];
  if (opts.from) parts.push(where("date", ">=", opts.from));
  if (opts.to) parts.push(where("date", "<=", opts.to));
  parts.push(orderBy("date", "desc"), limit(opts.limit || 500));
  const snap = await getDocs(query(...parts));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
async function loadJournal(from, to, code) {
  const c = collection(db, `companies/${cid()}/journal`);
  const parts = [c, where("void", "==", false)];
  if (code) parts.push(where("codes", "array-contains", code));
  if (from) parts.push(where("dateTs", ">=", Timestamp.fromDate(new Date(from + "T00:00:00Z"))));
  if (to) parts.push(where("dateTs", "<=", Timestamp.fromDate(new Date(to + "T23:59:59Z"))));
  parts.push(orderBy("dateTs", "asc"), limit(5000));
  const snap = await getDocs(query(...parts));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ---------------- shared UI bits ---------------- */
const writeBtn = (label, act, cls = "btn-p") => `<button class="btn ${cls} btn-s" data-act="${act}" ${canWrite() ? "" : "disabled"}>${label}</button>`;
const statusTag = (s) => `<span class="tag ${s === "void" ? "void" : s}">${t(s === "void" ? "voidTag" : s)}</span>`;
function dateFilterBar(state, onApply) {
  return `<div class="toolbar"><label class="small muted">${t("from")}</label><input type="date" id="dfrom" value="${state.from}"><label class="small muted">${t("to")}</label><input type="date" id="dto" value="${state.to}"><button class="btn btn-o btn-s" id="dapply">${t("apply")}</button><span class="sp"></span><span id="tbextra"></span></div>`;
}
function bindDateFilter(root, state, onApply) { $("#dapply", root).addEventListener("click", () => { state.from = $("#dfrom", root).value; state.to = $("#dto", root).value; onApply(); }); }
function accSelect(name, list, selected, allowEmpty) {
  return `<select name="${name}">${allowEmpty ? `<option value="">—</option>` : ""}${list.map((a) => opt(a.code, accLabel(a), selected)).join("")}</select>`;
}
function contactSelect(name, type, selected) {
  const list = S.contacts.filter((c) => c.active !== false && (type === "any" || c.type === type || c.type === "both"));
  return `<select name="${name}" required><option value="">—</option>${list.map((c) => opt(c.id, c.name, selected)).join("")}</select>`;
}
async function voidFlow(kind, id) {
  const reason = prompt(t("confirmVoid")); if (reason === null) return;
  try { await call("voidEntry", { companyId: cid(), kind, id, reason }); toast(t("voided")); route(); } catch (e) { toast(e.message, true); }
}

/* ---------------- HOME ---------------- */
VIEWS.home = async (root) => {
  const fy = fyRange(S.company.fiscalYearStartMonth);
  const mFrom = today().slice(0, 7) + "-01";
  const [journal, invoices] = await Promise.all([loadJournal(mFrom, today()), loadDocs("invoices", { limit: 200 })]);
  let rev = 0, exp = 0;
  journal.forEach((j) => j.lines.forEach((l) => { if (l.type === "revenue") rev += l.credit - l.debit; if (l.type === "expense") exp += l.debit - l.credit; }));
  const openInv = invoices.filter((i) => !i.void && i.status !== "paid");
  const recv = S.contacts.filter((c) => c.balance > 0).reduce((s, c) => s + c.balance, 0);
  const pay = S.contacts.filter((c) => c.balance < 0).reduce((s, c) => s - c.balance, 0);
  const recent = (await loadJournal(fy.from, fy.to)).slice(-8).reverse();
  root.innerHTML = `
    <div class="cards">
      <div class="card"><div class="k">${t("monthRev")}</div><div class="v num">${fmt(rev)}</div><div class="sub">KWD · ${mFrom.slice(0, 7)}</div></div>
      <div class="card"><div class="k">${t("monthExp")}</div><div class="v num">${fmt(exp)}</div><div class="sub">KWD</div></div>
      <div class="card"><div class="k">${t("recvBal")}</div><div class="v num">${fmt(recv)}</div><div class="sub">${openInv.length} ${t("todayInv")}</div></div>
      <div class="card"><div class="k">${t("payBal")}</div><div class="v num">${fmt(pay)}</div><div class="sub">KWD</div></div>
    </div>
    <div class="panel"><h3>${t("quick")}</h3><div class="toolbar">
      ${writeBtn("+ " + t("journal"), "j")} ${writeBtn("+ " + t("invoices"), "i")} ${writeBtn("+ " + t("expenses"), "e")} ${writeBtn("+ " + t("receipts"), "r")} ${writeBtn("+ " + t("orders"), "o")}
    </div><div class="small muted">${t("hintOpening")}</div></div>
    <div class="panel"><h3>${t("recent")}</h3>${journalTable(recent)}</div>`;
  const go = { j: "journal", i: "invoices", e: "expenses", r: "receipts", o: "orders" };
  $$("[data-act]", root).forEach((b) => b.addEventListener("click", () => { location.hash = "#" + go[b.dataset.act] + "?new=1"; }));
};

function journalTable(rows, withVoid) {
  if (!rows.length) return `<div class="empty">${t("noData")}</div>`;
  return `<div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>${t("date")}</th><th>${t("memo")}</th><th>${t("account")}</th><th class="n">${t("debit")}</th><th class="n">${t("credit")}</th>${withVoid ? `<th></th>` : ""}</tr></thead><tbody>
  ${rows.map((j) => j.lines.map((l, i) => `<tr class="${j.void ? "muted" : ""}">${i === 0 ? `<td rowspan="${j.lines.length}">${j.number}${j.void ? ` ${statusTag("void")}` : ""}</td><td rowspan="${j.lines.length}" class="num">${j.date}</td><td rowspan="${j.lines.length}">${esc(j.memo)}${j.ref ? `<div class="small muted">${esc(j.ref)}</div>` : ""}</td>` : ""}<td>${esc(l.code)} — ${esc(isAr() ? l.nameAr : l.nameEn)}${l.memo ? `<div class="small muted">${esc(l.memo)}</div>` : ""}</td><td class="n">${l.debit ? fmt(l.debit) : ""}</td><td class="n">${l.credit ? fmt(l.credit) : ""}</td>${withVoid && i === 0 ? `<td rowspan="${j.lines.length}" class="act">${!j.void && j.kind === "journal" && canWrite() ? `<button data-void="${j.id}">${t("void")}</button>` : ""}</td>` : ""}</tr>`).join("")).join("")}
  </tbody></table></div>`;
}

/* ---------------- JOURNAL ---------------- */
const JF = fyRange(1);
VIEWS.journal = async (root) => {
  const st = VIEWS.journal.st || (VIEWS.journal.st = fyRange(S.company.fiscalYearStartMonth));
  const c = collection(db, `companies/${cid()}/journal`);
  const snap = await getDocs(query(c, where("dateTs", ">=", Timestamp.fromDate(new Date(st.from + "T00:00:00Z"))), where("dateTs", "<=", Timestamp.fromDate(new Date(st.to + "T23:59:59Z"))), orderBy("dateTs", "desc"), limit(1000)));
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  root.innerHTML = `${dateFilterBar(st)}<div class="panel"><h3>${t("journal")} ${writeBtn("+ " + t("new"), "new")}</h3>${journalTable(rows, true)}</div>`;
  bindDateFilter(root, st, route);
  $("[data-act=new]", root)?.addEventListener("click", journalForm);
  $$("[data-void]", root).forEach((b) => b.addEventListener("click", () => voidFlow("journal", b.dataset.void)));
  if (location.hash.includes("new=1") && canWrite()) { history.replaceState(null, "", "#journal"); journalForm(); }
};
function journalForm() {
  const accs = accountsBy(() => true);
  const lineHtml = (l = {}) => `<div class="line"><div>${accSelect("code", accs, l.code)}</div><input name="debit" type="number" step="0.001" min="0" placeholder="${t("debit")}" value="${l.debit || ""}"><input name="credit" type="number" step="0.001" min="0" placeholder="${t("credit")}" value="${l.credit || ""}"><button type="button" class="x" data-x>×</button></div>`;
  const m = openModal(`<h2>${t("journal")} — ${t("new")}<button data-close>×</button></h2>
    <form id="jf"><div class="row"><div class="f"><label>${t("date")}</label><input name="date" type="date" value="${today()}" required></div><div class="f"><label>${t("ref")}</label><input name="ref" maxlength="60"></div></div>
    <div class="f"><label>${t("memo")}</label><input name="memo" maxlength="300" required placeholder="${t("opening")}"></div>
    <div class="lines" id="lines">${lineHtml()}${lineHtml()}</div>
    <div class="toolbar" style="margin-top:8px"><button type="button" class="btn btn-o btn-s" id="addl">${t("addLine")}</button><span class="sp"></span><div class="totals"><span>${t("debit")}: <b id="td">0.000</b></span><span>${t("credit")}: <b id="tc">0.000</b></span></div></div>
    <div id="jerr"></div><div class="mfoot"><button type="button" class="btn btn-o" data-close>${t("cancel")}</button><button class="btn btn-p" type="submit">${t("post")}</button></div></form>`);
  const recalc = () => { let d = 0, c = 0; $$(".line", m).forEach((r) => { d += Number($("[name=debit]", r).value) || 0; c += Number($("[name=credit]", r).value) || 0; }); $("#td", m).textContent = fmt(d); $("#tc", m).textContent = fmt(c); $("#tc", m).className = Math.abs(d - c) > 0.0005 ? "neg" : "pos"; };
  const wire = (r) => { $("[data-x]", r).addEventListener("click", () => { if ($$(".line", m).length > 2) { r.remove(); recalc(); } }); $$("input", r).forEach((i) => i.addEventListener("input", recalc)); };
  $$(".line", m).forEach(wire);
  $("#addl", m).addEventListener("click", () => { $("#lines", m).insertAdjacentHTML("beforeend", lineHtml()); wire($("#lines", m).lastElementChild); });
  $$('[data-close]', m).forEach((b) => b.addEventListener("click", closeModal));
  $("#jf", m).addEventListener("submit", async (e) => {
    e.preventDefault(); const f = e.target; const btn = $("button[type=submit]", f); busy(btn, true); $("#jerr", m).innerHTML = "";
    const lines = $$(".line", m).map((r) => ({ code: $("[name=code]", r).value, debit: Number($("[name=debit]", r).value) || 0, credit: Number($("[name=credit]", r).value) || 0 })).filter((l) => l.debit || l.credit);
    try { await call("postEntry", { companyId: cid(), kind: "journal", data: { date: f.date.value, ref: f.ref.value, memo: f.memo.value, lines } }); closeModal(); toast(t("posted")); route(); }
    catch (ex) { $("#jerr", m).innerHTML = `<div class="err">${esc(ex.message)}</div>`; busy(btn, false); }
  });
}

/* ---------------- ACCOUNTS ---------------- */
VIEWS.accounts = async (root) => {
  const groups = ["asset", "liability", "equity", "revenue", "expense"];
  root.innerHTML = `<div class="panel"><h3>${t("accounts")} ${writeBtn("+ " + t("new"), "new")}</h3><div class="scroll"><table class="tbl"><thead><tr><th>${t("code")}</th><th>${t("nameAr")}</th><th>${t("nameEn")}</th><th>${t("type")}</th><th>${t("status")}</th><th></th></tr></thead><tbody>
    ${groups.map((g) => `<tr class="hd"><td colspan="6">${typeLabel(g)}</td></tr>` + S.accounts.filter((a) => a.type === g).map((a) => `<tr class="${a.active === false ? "muted" : ""}"><td class="num">${esc(a.code)}</td><td>${esc(a.nameAr)}</td><td dir="ltr">${esc(a.nameEn || "")}</td><td><span class="small muted">${esc(a.subtype || "")}</span>${a.system ? ` <span class="tag paid">${t("sysAccount")}</span>` : ""}</td><td>${a.active === false ? t("inactive") : t("activeAcc")}</td><td class="act">${canWrite() ? `<button data-edit="${a.code}">${t("edit")}</button>${a.system ? "" : `<button data-del="${a.code}">${t("delete")}</button>`}` : ""}</td></tr>`).join("")).join("")}
  </tbody></table></div></div>`;
  $("[data-act=new]", root)?.addEventListener("click", () => accountForm());
  $$("[data-edit]", root).forEach((b) => b.addEventListener("click", () => accountForm(findAcc(b.dataset.edit))));
  $$("[data-del]", root).forEach((b) => b.addEventListener("click", async () => { if (!confirm(t("confirmDel"))) return; try { await call("deleteRecord", { companyId: cid(), collection: "accounts", id: b.dataset.del }); toast(t("deleted")); } catch (e) { toast(e.message, true); } }));
};
function accountForm(a = {}) {
  const m = openModal(`<h2>${t("account")}<button data-close>×</button></h2><form id="af">
    <div class="row"><div class="f"><label>${t("code")}</label><input name="code" value="${esc(a.code || "")}" ${a.code ? "readonly" : ""} required pattern="\\d{4,6}" dir="ltr"></div>
    <div class="f"><label>${t("type")}</label><select name="type" ${a.system ? "disabled" : ""}>${["asset", "liability", "equity", "revenue", "expense"].map((ty) => opt(ty, typeLabel(ty), a.type || "expense")).join("")}</select></div></div>
    <div class="row"><div class="f"><label>${t("nameAr")}</label><input name="nameAr" value="${esc(a.nameAr || "")}" required maxlength="80"></div><div class="f"><label>${t("nameEn")}</label><input name="nameEn" value="${esc(a.nameEn || "")}" maxlength="80" dir="ltr"></div></div>
    <div class="row"><div class="f"><label>subtype</label><select name="subtype" ${a.system ? "disabled" : ""}>${["", "cash", "bank", "receivable", "inventory", "prepaid", "fixed", "payable", "accrued", "loan", "advance", "capital", "drawings", "sales", "service", "other", "cogs", "opex"].map((x) => opt(x, x || "—", a.subtype || "")).join("")}</select><div class="hint">cash / bank ← ${isAr() ? "لحسابات الصندوق والبنك حتى تظهر في القبض والصرف" : "so the account appears in receipts & payments"}</div></div>
    <div class="f"><label>${t("status")}</label><select name="active">${opt("1", t("activeAcc"), a.active === false ? "0" : "1")}${opt("0", t("inactive"), a.active === false ? "0" : "1")}</select></div></div>
    <div id="aerr"></div><div class="mfoot"><button type="button" class="btn btn-o" data-close>${t("cancel")}</button><button class="btn btn-p" type="submit">${t("save")}</button></div></form>`);
  $("#af", m).addEventListener("submit", async (e) => {
    e.preventDefault(); const f = e.target; const btn = $("button[type=submit]", f); busy(btn, true);
    try { await call("saveRecord", { companyId: cid(), collection: "accounts", data: { code: f.code.value, type: f.type.value, subtype: f.subtype.value, nameAr: f.nameAr.value, nameEn: f.nameEn.value, active: f.active.value === "1" } }); closeModal(); toast(t("saved")); }
    catch (ex) { $("#aerr", m).innerHTML = `<div class="err">${esc(ex.message)}</div>`; busy(btn, false); }
  });
}

/* ---------------- CONTACTS ---------------- */
VIEWS.contacts = async (root) => {
  root.innerHTML = `<div class="panel"><h3>${t("contacts")} ${writeBtn("+ " + t("new"), "new")}</h3>${S.contacts.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>${t("name")}</th><th>${t("type")}</th><th>${t("phone")}</th><th>${t("email")}</th><th class="n">${t("balance")}</th><th></th></tr></thead><tbody>
    ${S.contacts.map((c) => `<tr><td>${esc(c.name)}${c.crNumber ? `<div class="small muted">${esc(c.crNumber)}</div>` : ""}</td><td>${t(c.type === "both" ? "both" : c.type)}</td><td class="num">${esc(c.phone || "")}</td><td dir="ltr">${esc(c.email || "")}</td><td class="n ${c.balance > 0 ? "pos" : c.balance < 0 ? "neg" : ""}">${fmt(c.balance || 0)}</td><td class="act">${canWrite() ? `<button data-edit="${c.id}">${t("edit")}</button><button data-del="${c.id}">${t("delete")}</button>` : ""}</td></tr>`).join("")}
  </tbody></table></div><div class="small muted" style="margin-top:8px">${isAr() ? "الرصيد الموجب = مستحق لك من العميل · السالب = مستحق عليك للمورد" : "Positive = owed to you by the customer · Negative = you owe the supplier"}</div>` : `<div class="empty">${t("noData")}</div>`}</div>`;
  $("[data-act=new]", root)?.addEventListener("click", () => contactForm());
  $$("[data-edit]", root).forEach((b) => b.addEventListener("click", () => contactForm(S.contacts.find((c) => c.id === b.dataset.edit))));
  $$("[data-del]", root).forEach((b) => b.addEventListener("click", async () => { if (!confirm(t("confirmDel"))) return; try { await call("deleteRecord", { companyId: cid(), collection: "contacts", id: b.dataset.del }); toast(t("deleted")); } catch (e) { toast(e.message, true); } }));
};
function contactForm(c = {}) {
  const m = openModal(`<h2>${t("contacts")}<button data-close>×</button></h2><form id="cf">
    <div class="row"><div class="f"><label>${t("name")}</label><input name="name" value="${esc(c.name || "")}" required maxlength="120"></div><div class="f"><label>${t("type")}</label><select name="type">${opt("customer", t("customer"), c.type || "customer")}${opt("supplier", t("supplier"), c.type)}${opt("both", t("both"), c.type)}</select></div></div>
    <div class="row"><div class="f"><label>${t("phone")}</label><input name="phone" value="${esc(c.phone || "")}" maxlength="30" dir="ltr"></div><div class="f"><label>${t("email")}</label><input name="email" type="email" value="${esc(c.email || "")}" maxlength="200" dir="ltr"></div><div class="f"><label>${t("crNumber")}</label><input name="crNumber" value="${esc(c.crNumber || "")}" maxlength="40" dir="ltr"></div></div>
    <div class="f"><label>${t("notes")}</label><textarea name="notes" rows="2" maxlength="500">${esc(c.notes || "")}</textarea></div>
    <div id="cerr"></div><div class="mfoot"><button type="button" class="btn btn-o" data-close>${t("cancel")}</button><button class="btn btn-p" type="submit">${t("save")}</button></div></form>`);
  $("#cf", m).addEventListener("submit", async (e) => {
    e.preventDefault(); const f = e.target; const btn = $("button[type=submit]", f); busy(btn, true);
    try { await call("saveRecord", { companyId: cid(), collection: "contacts", id: c.id, data: { name: f.name.value, type: f.type.value, phone: f.phone.value, email: f.email.value, crNumber: f.crNumber.value, notes: f.notes.value } }); closeModal(); toast(t("saved")); }
    catch (ex) { $("#cerr", m).innerHTML = `<div class="err">${esc(ex.message)}</div>`; busy(btn, false); }
  });
}

/* ---------------- INVOICES ---------------- */
VIEWS.invoices = async (root) => {
  const st = VIEWS.invoices.st || (VIEWS.invoices.st = fyRange(S.company.fiscalYearStartMonth));
  const rows = await loadDocs("invoices", st);
  root.innerHTML = `${dateFilterBar(st)}<div class="panel"><h3>${t("invoices")} ${writeBtn("+ " + t("new"), "new")}</h3>${rows.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>${t("date")}</th><th>${t("customer")}</th><th class="n">${t("total")}</th><th class="n">${t("paid")}</th><th class="n">${t("remaining")}</th><th>${t("status")}</th><th></th></tr></thead><tbody>
    ${rows.map((i) => `<tr class="${i.void ? "muted" : ""}"><td>${i.number}</td><td class="num">${i.date}<div class="small muted">${t("dueDate")}: ${i.dueDate}</div></td><td>${esc(i.contactName)}<div class="small muted">${i.lines.map((l) => esc(l.desc)).join(" · ").slice(0, 80)}</div></td><td class="n">${fmt(i.total)}</td><td class="n">${fmt(i.paid)}</td><td class="n">${fmt(i.total - i.paid)}</td><td>${statusTag(i.void ? "void" : i.status)}</td><td class="act">${!i.void && canWrite() ? `${i.status !== "paid" ? `<button data-collect="${i.id}">${t("receipts")}</button>` : ""}<button data-void="${i.id}">${t("void")}</button>` : ""}</td></tr>`).join("")}
  </tbody></table></div>` : `<div class="empty">${t("noData")}</div>`}</div>`;
  bindDateFilter(root, st, route);
  $("[data-act=new]", root)?.addEventListener("click", invoiceForm);
  $$("[data-void]", root).forEach((b) => b.addEventListener("click", () => voidFlow("invoice", b.dataset.void)));
  $$("[data-collect]", root).forEach((b) => b.addEventListener("click", () => receiptForm(rows.find((i) => i.id === b.dataset.collect))));
  if (location.hash.includes("new=1") && canWrite()) { history.replaceState(null, "", "#invoices"); invoiceForm(); }
};
function invoiceForm() {
  if (!S.contacts.some((c) => c.type !== "supplier")) { toast(t("needContact"), true); return; }
  const revAcc = accountsBy((a) => a.type === "revenue");
  const lineHtml = () => `<div class="line inv"><input name="desc" placeholder="${t("desc")}" maxlength="160" required><input name="qty" type="number" step="0.001" min="0.001" value="1" placeholder="${t("qty")}"><input name="price" type="number" step="0.001" min="0" placeholder="${t("price")}"><div>${accSelect("accountCode", revAcc, "4100")}</div><button type="button" class="x" data-x>×</button></div>`;
  const m = openModal(`<h2>${t("invoices")} — ${t("new")}<button data-close>×</button></h2><form id="if">
    <div class="row"><div class="f"><label>${t("customer")}</label>${contactSelect("contactId", "customer")}</div><div class="f"><label>${t("date")}</label><input name="date" type="date" value="${today()}" required></div><div class="f"><label>${t("dueDate")}</label><input name="dueDate" type="date" value="${addDays(today(), 30)}"></div></div>
    <div class="lines" id="lines">${lineHtml()}</div>
    <div class="toolbar" style="margin-top:8px"><button type="button" class="btn btn-o btn-s" id="addl">${t("addLine")}</button><span class="sp"></span><div class="f" style="margin:0;max-width:160px"><input name="discount" type="number" step="0.001" min="0" value="0" placeholder="${t("discount")}"></div><div class="totals"><span>${t("total")}: <b id="tt">0.000</b></span></div></div>
    <div class="f"><label>${t("notes")}</label><input name="notes" maxlength="500"></div>
    <div id="ierr"></div><div class="mfoot"><button type="button" class="btn btn-o" data-close>${t("cancel")}</button><button class="btn btn-p" type="submit">${t("post")}</button></div></form>`);
  const recalc = () => { let s = 0; $$(".line", m).forEach((r) => { s += (Number($("[name=qty]", r).value) || 0) * (Number($("[name=price]", r).value) || 0); }); $("#tt", m).textContent = fmt(s - (Number($("[name=discount]", m).value) || 0)); };
  const wire = (r) => { $("[data-x]", r).addEventListener("click", () => { if ($$(".line", m).length > 1) { r.remove(); recalc(); } }); $$("input", r).forEach((i) => i.addEventListener("input", recalc)); };
  $$(".line", m).forEach(wire); $("[name=discount]", m).addEventListener("input", recalc);
  $("#addl", m).addEventListener("click", () => { $("#lines", m).insertAdjacentHTML("beforeend", lineHtml()); wire($("#lines", m).lastElementChild); });
  $("#if", m).addEventListener("submit", async (e) => {
    e.preventDefault(); const f = e.target; const btn = $("button[type=submit]", f); busy(btn, true);
    const lines = $$(".line", m).map((r) => ({ desc: $("[name=desc]", r).value, qty: Number($("[name=qty]", r).value), price: Number($("[name=price]", r).value), accountCode: $("[name=accountCode]", r).value }));
    try { await call("postEntry", { companyId: cid(), kind: "invoice", data: { contactId: f.contactId.value, date: f.date.value, dueDate: f.dueDate.value, lines, discount: Number(f.discount.value) || 0, notes: f.notes.value } }); closeModal(); toast(t("posted")); route(); }
    catch (ex) { $("#ierr", m).innerHTML = `<div class="err">${esc(ex.message)}</div>`; busy(btn, false); }
  });
}

/* ---------------- RECEIPTS ---------------- */
VIEWS.receipts = async (root) => {
  const st = VIEWS.receipts.st || (VIEWS.receipts.st = fyRange(S.company.fiscalYearStartMonth));
  const rows = await loadDocs("receipts", st);
  root.innerHTML = `${dateFilterBar(st)}<div class="panel"><h3>${t("receipts")} ${writeBtn("+ " + t("new"), "new")}</h3>${rows.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>${t("date")}</th><th>${t("customer")}</th><th>${t("toAccount")}</th><th>${t("forInvoice")}</th><th class="n">${t("amount")}</th><th></th></tr></thead><tbody>
    ${rows.map((r) => { const a = findAcc(r.toCode); return `<tr class="${r.void ? "muted" : ""}"><td>${r.number}${r.void ? ` ${statusTag("void")}` : ""}</td><td class="num">${r.date}</td><td>${esc(r.contactName)}<div class="small muted">${esc(r.method || "")} ${esc(r.ref || "")}</div></td><td>${a ? esc(accName(a)) : r.toCode}</td><td class="num">${r.invoiceId ? "✓" : "—"}</td><td class="n">${fmt(r.amount)}</td><td class="act">${!r.void && canWrite() ? `<button data-void="${r.id}">${t("void")}</button>` : ""}</td></tr>`; }).join("")}
  </tbody></table></div>` : `<div class="empty">${t("noData")}</div>`}</div>`;
  bindDateFilter(root, st, route);
  $("[data-act=new]", root)?.addEventListener("click", () => receiptForm());
  $$("[data-void]", root).forEach((b) => b.addEventListener("click", () => voidFlow("receipt", b.dataset.void)));
  if (location.hash.includes("new=1") && canWrite()) { history.replaceState(null, "", "#receipts"); receiptForm(); }
};
async function receiptForm(invoice) {
  if (!S.contacts.some((c) => c.type !== "supplier")) { toast(t("needContact"), true); return; }
  const cash = cashAccounts();
  const m = openModal(`<h2>${t("receipts")} — ${t("new")}<button data-close>×</button></h2><form id="rf">
    <div class="row"><div class="f"><label>${t("customer")}</label>${contactSelect("contactId", "customer", invoice && invoice.contactId)}</div><div class="f"><label>${t("date")}</label><input name="date" type="date" value="${today()}" required></div></div>
    <div class="row"><div class="f"><label>${t("forInvoice")}</label><select name="invoiceId" id="invsel"><option value="">${t("noneInv")}</option></select></div><div class="f"><label>${t("amount")}</label><input name="amount" type="number" step="0.001" min="0.001" required value="${invoice ? money(invoice.total - invoice.paid) : ""}"></div></div>
    <div class="row"><div class="f"><label>${t("toAccount")}</label>${accSelect("toCode", cash, "1110")}</div><div class="f"><label>${t("method")}</label><select name="method">${["KNET", "Cash", "Transfer", "Link", "Card"].map((x) => opt(x, x)).join("")}</select></div><div class="f"><label>${t("ref")}</label><input name="ref" maxlength="60"></div></div>
    <div class="f" id="advwrap"><label><input type="checkbox" name="asAdvance"> ${t("asAdvance")}</label></div>
    <div id="rerr"></div><div class="mfoot"><button type="button" class="btn btn-o" data-close>${t("cancel")}</button><button class="btn btn-p" type="submit">${t("post")}</button></div></form>`);
  const fillInvoices = async () => {
    const cId = $("[name=contactId]", m).value; const sel = $("#invsel", m); sel.innerHTML = `<option value="">${t("noneInv")}</option>`;
    if (!cId) return;
    const snap = await getDocs(query(collection(db, `companies/${cid()}/invoices`), where("contactId", "==", cId), orderBy("date", "desc"), limit(100)));
    snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((i) => !i.void && i.status !== "paid").forEach((i) => sel.insertAdjacentHTML("beforeend", `<option value="${i.id}" data-rem="${money(i.total - i.paid)}" ${invoice && invoice.id === i.id ? "selected" : ""}>#${i.number} · ${i.date} · ${t("remaining")} ${fmt(i.total - i.paid)}</option>`));
    $("#advwrap", m).classList.toggle("hidden", !!sel.value);
  };
  $("[name=contactId]", m).addEventListener("change", fillInvoices);
  $("#invsel", m).addEventListener("change", () => { const o = $("#invsel", m).selectedOptions[0]; if (o && o.dataset.rem) $("[name=amount]", m).value = o.dataset.rem; $("#advwrap", m).classList.toggle("hidden", !!$("#invsel", m).value); });
  await fillInvoices();
  $("#rf", m).addEventListener("submit", async (e) => {
    e.preventDefault(); const f = e.target; const btn = $("button[type=submit]", f); busy(btn, true);
    try { await call("postEntry", { companyId: cid(), kind: "receipt", data: { contactId: f.contactId.value, date: f.date.value, invoiceId: f.invoiceId.value, amount: Number(f.amount.value), toCode: f.toCode.value, method: f.method.value, ref: f.ref.value, asAdvance: f.asAdvance.checked && !f.invoiceId.value } }); closeModal(); toast(t("posted")); route(); }
    catch (ex) { $("#rerr", m).innerHTML = `<div class="err">${esc(ex.message)}</div>`; busy(btn, false); }
  });
}

/* ---------------- EXPENSES ---------------- */
VIEWS.expenses = async (root) => {
  const st = VIEWS.expenses.st || (VIEWS.expenses.st = fyRange(S.company.fiscalYearStartMonth));
  const rows = await loadDocs("expenses", st);
  root.innerHTML = `${dateFilterBar(st)}<div class="panel"><h3>${t("expenses")} ${writeBtn("+ " + t("new"), "new")}</h3><div class="small muted" style="margin:-6px 0 12px">${t("hintInventory")}</div>${rows.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>${t("date")}</th><th>${t("expenseAccount")}</th><th>${t("supplier")}</th><th>${t("paidFrom")}</th><th class="n">${t("amount")}</th><th>${t("status")}</th><th></th></tr></thead><tbody>
    ${rows.map((x) => { const a = x.paidFrom === "credit" ? null : findAcc(x.paidFrom); return `<tr class="${x.void ? "muted" : ""}"><td>${x.number}</td><td class="num">${x.date}</td><td>${esc(x.accountName)}${x.memo ? `<div class="small muted">${esc(x.memo)}</div>` : ""}</td><td>${esc(x.supplierName || "—")}</td><td>${x.paidFrom === "credit" ? t("onCredit") : (a ? esc(accName(a)) : x.paidFrom)}</td><td class="n">${fmt(x.amount)}</td><td>${statusTag(x.void ? "void" : x.status)}</td><td class="act">${!x.void && canWrite() ? `${x.paidFrom === "credit" && x.status !== "paid" ? `<button data-pay="${x.id}">${t("payments")}</button>` : ""}<button data-void="${x.id}">${t("void")}</button>` : ""}</td></tr>`; }).join("")}
  </tbody></table></div>` : `<div class="empty">${t("noData")}</div>`}</div>`;
  bindDateFilter(root, st, route);
  $("[data-act=new]", root)?.addEventListener("click", expenseForm);
  $$("[data-void]", root).forEach((b) => b.addEventListener("click", () => voidFlow("expense", b.dataset.void)));
  $$("[data-pay]", root).forEach((b) => b.addEventListener("click", () => paymentForm(rows.find((x) => x.id === b.dataset.pay))));
  if (location.hash.includes("new=1") && canWrite()) { history.replaceState(null, "", "#expenses"); expenseForm(); }
};
function expenseForm() {
  const expAcc = accountsBy((a) => a.type === "expense" || (a.type === "asset" && ["inventory", "fixed", "prepaid"].includes(a.subtype)));
  const cash = cashAccounts();
  const m = openModal(`<h2>${t("expenses")} — ${t("new")}<button data-close>×</button></h2><form id="ef">
    <div class="row"><div class="f"><label>${t("date")}</label><input name="date" type="date" value="${today()}" required></div><div class="f"><label>${t("amount")}</label><input name="amount" type="number" step="0.001" min="0.001" required></div></div>
    <div class="row"><div class="f"><label>${t("expenseAccount")}</label>${accSelect("accountCode", expAcc, "6990")}</div><div class="f"><label>${t("supplier")}</label><select name="supplierId"><option value="">—</option>${S.contacts.filter((c) => c.type !== "customer").map((c) => opt(c.id, c.name)).join("")}</select></div></div>
    <div class="row"><div class="f"><label>${t("paidFrom")}</label><select name="paidFrom">${cash.map((a) => opt(a.code, accLabel(a), "1110")).join("")}${opt("credit", t("onCredit"))}</select></div><div class="f"><label>${t("ref")}</label><input name="ref" maxlength="60"></div></div>
    <div class="f"><label>${t("memo")}</label><input name="memo" maxlength="300"></div>
    <div id="eerr"></div><div class="mfoot"><button type="button" class="btn btn-o" data-close>${t("cancel")}</button><button class="btn btn-p" type="submit">${t("post")}</button></div></form>`);
  $("#ef", m).addEventListener("submit", async (e) => {
    e.preventDefault(); const f = e.target; const btn = $("button[type=submit]", f); busy(btn, true);
    try { await call("postEntry", { companyId: cid(), kind: "expense", data: { date: f.date.value, amount: Number(f.amount.value), accountCode: f.accountCode.value, supplierId: f.supplierId.value, paidFrom: f.paidFrom.value, ref: f.ref.value, memo: f.memo.value } }); closeModal(); toast(t("posted")); route(); }
    catch (ex) { $("#eerr", m).innerHTML = `<div class="err">${esc(ex.message)}</div>`; busy(btn, false); }
  });
}

/* ---------------- SUPPLIER PAYMENTS ---------------- */
VIEWS.payments = async (root) => {
  const st = VIEWS.payments.st || (VIEWS.payments.st = fyRange(S.company.fiscalYearStartMonth));
  const rows = await loadDocs("payments", st);
  root.innerHTML = `${dateFilterBar(st)}<div class="panel"><h3>${t("payments")} ${writeBtn("+ " + t("new"), "new")}</h3>${rows.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>${t("date")}</th><th>${t("supplier")}</th><th>${t("fromAccount")}</th><th class="n">${t("amount")}</th><th></th></tr></thead><tbody>
    ${rows.map((r) => { const a = findAcc(r.fromCode); return `<tr class="${r.void ? "muted" : ""}"><td>${r.number}${r.void ? ` ${statusTag("void")}` : ""}</td><td class="num">${r.date}</td><td>${esc(r.supplierName)}<div class="small muted">${esc(r.method || "")} ${esc(r.ref || "")}</div></td><td>${a ? esc(accName(a)) : r.fromCode}</td><td class="n">${fmt(r.amount)}</td><td class="act">${!r.void && canWrite() ? `<button data-void="${r.id}">${t("void")}</button>` : ""}</td></tr>`; }).join("")}
  </tbody></table></div>` : `<div class="empty">${t("noData")}</div>`}</div>`;
  bindDateFilter(root, st, route);
  $("[data-act=new]", root)?.addEventListener("click", () => paymentForm());
  $$("[data-void]", root).forEach((b) => b.addEventListener("click", () => voidFlow("payment", b.dataset.void)));
};
async function paymentForm(expense) {
  if (!S.contacts.some((c) => c.type !== "customer")) { toast(t("needSupplier"), true); return; }
  const cash = cashAccounts();
  const m = openModal(`<h2>${t("payments")} — ${t("new")}<button data-close>×</button></h2><form id="pf">
    <div class="row"><div class="f"><label>${t("supplier")}</label>${contactSelect("supplierId", "supplier", expense && expense.supplierId)}</div><div class="f"><label>${t("date")}</label><input name="date" type="date" value="${today()}" required></div></div>
    <div class="row"><div class="f"><label>${t("forExpense")}</label><select name="expenseId" id="exsel"><option value="">—</option></select></div><div class="f"><label>${t("amount")}</label><input name="amount" type="number" step="0.001" min="0.001" required value="${expense ? money(expense.amount - expense.paid) : ""}"></div></div>
    <div class="row"><div class="f"><label>${t("fromAccount")}</label>${accSelect("fromCode", cash, "1110")}</div><div class="f"><label>${t("method")}</label><select name="method">${["Transfer", "Cash", "KNET", "Card"].map((x) => opt(x, x)).join("")}</select></div><div class="f"><label>${t("ref")}</label><input name="ref" maxlength="60"></div></div>
    <div id="perr"></div><div class="mfoot"><button type="button" class="btn btn-o" data-close>${t("cancel")}</button><button class="btn btn-p" type="submit">${t("post")}</button></div></form>`);
  const fill = async () => {
    const sId = $("[name=supplierId]", m).value; const sel = $("#exsel", m); sel.innerHTML = `<option value="">—</option>`; if (!sId) return;
    const rows = (await loadDocs("expenses", { limit: 200 })).filter((x) => !x.void && x.supplierId === sId && x.paidFrom === "credit" && x.status !== "paid");
    rows.forEach((x) => sel.insertAdjacentHTML("beforeend", `<option value="${x.id}" data-rem="${money(x.amount - x.paid)}" ${expense && expense.id === x.id ? "selected" : ""}>#${x.number} · ${x.date} · ${esc(x.accountName)} · ${fmt(x.amount - x.paid)}</option>`));
  };
  $("[name=supplierId]", m).addEventListener("change", fill);
  $("#exsel", m).addEventListener("change", () => { const o = $("#exsel", m).selectedOptions[0]; if (o && o.dataset.rem) $("[name=amount]", m).value = o.dataset.rem; });
  await fill();
  $("#pf", m).addEventListener("submit", async (e) => {
    e.preventDefault(); const f = e.target; const btn = $("button[type=submit]", f); busy(btn, true);
    try { await call("postEntry", { companyId: cid(), kind: "payment", data: { supplierId: f.supplierId.value, date: f.date.value, expenseId: f.expenseId.value, amount: Number(f.amount.value), fromCode: f.fromCode.value, method: f.method.value, ref: f.ref.value } }); closeModal(); toast(t("posted")); route(); }
    catch (ex) { $("#perr", m).innerHTML = `<div class="err">${esc(ex.message)}</div>`; busy(btn, false); }
  });
}

/* ---------------- ORDERS (SME sales with product cost) ---------------- */
const productCost = (p) => p.costMode === "materials" ? money((p.materials || []).reduce((s, m) => { const mat = S.materials.find((x) => x.id === m.materialId); return s + (mat ? mat.unitCost * m.qty : 0); }, 0)) : money(p.cost);
VIEWS.orders = async (root) => {
  const st = VIEWS.orders.st || (VIEWS.orders.st = fyRange(S.company.fiscalYearStartMonth));
  const rows = await loadDocs("orders", st);
  const live = rows.filter((o) => !o.void);
  const tot = live.reduce((s, o) => s + o.total, 0), cost = live.reduce((s, o) => s + o.cost, 0);
  root.innerHTML = `${dateFilterBar(st)}
    <div class="cards"><div class="card"><div class="k">${t("orders")}</div><div class="v">${fmt0(live.length)}</div></div><div class="card"><div class="k">${t("revenue")}</div><div class="v num">${fmt(tot)}</div></div><div class="card"><div class="k">${t("cost")}</div><div class="v num">${fmt(cost)}</div></div><div class="card"><div class="k">${t("profit")}</div><div class="v num ${tot - cost < 0 ? "neg" : ""}">${fmt(tot - cost)}</div><div class="sub">${pct(tot ? (tot - cost) / tot : NaN)}</div></div></div>
    <div class="panel"><h3>${t("orders")} ${writeBtn("+ " + t("new"), "new")}</h3>${rows.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>${t("date")}</th><th>${t("customer")}</th><th>${t("channel")}</th><th>${t("product")}</th><th class="n">${t("total")}</th><th class="n">${t("cost")}</th><th class="n">${t("profit")}</th><th></th></tr></thead><tbody>
    ${rows.map((o) => { const camp = S.campaigns.find((c) => c.id === o.campaignId); return `<tr class="${o.void ? "muted" : ""}"><td>${o.number}${o.void ? ` ${statusTag("void")}` : ""}</td><td class="num">${o.date}</td><td>${esc(o.contactName || "—")}${o.paid ? "" : ` <span class="tag open">${t("onAccount")}</span>`}</td><td>${esc(o.channel || "")}${camp ? `<div class="small muted">${esc(camp.name)}</div>` : ""}</td><td>${o.items.map((i) => `${esc(i.name)} ×${i.qty}`).join("<br>")}</td><td class="n">${fmt(o.total)}</td><td class="n">${fmt(o.cost)}</td><td class="n ${o.profit < 0 ? "neg" : "pos"}">${fmt(o.profit)}</td><td class="act">${!o.void && canWrite() ? `<button data-void="${o.id}">${t("void")}</button>` : ""}</td></tr>`; }).join("")}
  </tbody></table></div>` : `<div class="empty">${t("noData")}</div>`}</div>`;
  bindDateFilter(root, st, route);
  $("[data-act=new]", root)?.addEventListener("click", orderForm);
  $$("[data-void]", root).forEach((b) => b.addEventListener("click", () => voidFlow("order", b.dataset.void)));
  if (location.hash.includes("new=1") && canWrite()) { history.replaceState(null, "", "#orders"); orderForm(); }
};
function orderForm() {
  const prods = S.products.filter((p) => p.active !== false);
  const cash = cashAccounts();
  const lineHtml = () => `<div class="line inv"><div><select name="productId"><option value="">${t("product")}…</option>${prods.map((p) => opt(p.id, p.name)).join("")}</select></div><input name="qty" type="number" step="1" min="1" value="1"><input name="price" type="number" step="0.001" min="0" placeholder="${t("price")}"><input name="cost" type="number" step="0.001" min="0" placeholder="${t("cost")}"><button type="button" class="x" data-x>×</button></div>`;
  const m = openModal(`<h2>${t("orders")} — ${t("new")}<button data-close>×</button></h2><form id="of">
    <div class="row"><div class="f"><label>${t("date")}</label><input name="date" type="date" value="${today()}" required></div><div class="f"><label>${t("channel")}</label><select name="channel">${["Instagram", "WhatsApp", "Website", "Store", "Exhibition", "Other"].map((x) => opt(x, x)).join("")}</select></div><div class="f"><label>${t("campaign")}</label><select name="campaignId"><option value="">—</option>${S.campaigns.map((c) => opt(c.id, c.name)).join("")}</select></div></div>
    <div class="lines" id="lines">${lineHtml()}</div>
    <div class="toolbar" style="margin-top:8px"><button type="button" class="btn btn-o btn-s" id="addl">${t("addLine")}</button><span class="sp"></span><div class="f" style="margin:0;max-width:160px"><input name="discount" type="number" step="0.001" min="0" value="0" placeholder="${t("discount")}"></div><div class="totals"><span>${t("total")}: <b id="tt">0.000</b></span><span>${t("profit")}: <b id="tp">0.000</b></span></div></div>
    <div class="row"><div class="f"><label>${t("isPaid")}</label><select name="paid">${opt("1", t("isPaid"))}${opt("0", t("onAccount"))}</select></div><div class="f" id="tow"><label>${t("toAccount")}</label>${accSelect("toCode", cash, "1110")}</div><div class="f hidden" id="cow"><label>${t("customer")}</label><select name="contactId"><option value="">—</option>${S.contacts.filter((c) => c.type !== "supplier").map((c) => opt(c.id, c.name)).join("")}</select></div></div>
    <div class="f"><label>${t("customer")} (${isAr() ? "اختياري" : "optional"})</label><input name="customerName" maxlength="120"></div>
    <div id="oerr"></div><div class="mfoot"><button type="button" class="btn btn-o" data-close>${t("cancel")}</button><button class="btn btn-p" type="submit">${t("post")}</button></div></form>`);
  const recalc = () => { let s = 0, c = 0; $$(".line", m).forEach((r) => { const q = Number($("[name=qty]", r).value) || 0; s += q * (Number($("[name=price]", r).value) || 0); c += q * (Number($("[name=cost]", r).value) || 0); }); const d = Number($("[name=discount]", m).value) || 0; $("#tt", m).textContent = fmt(s - d); $("#tp", m).textContent = fmt(s - d - c); };
  const wire = (r) => { $("[data-x]", r).addEventListener("click", () => { if ($$(".line", m).length > 1) { r.remove(); recalc(); } }); $$("input", r).forEach((i) => i.addEventListener("input", recalc)); $("[name=productId]", r).addEventListener("change", () => { const p = prods.find((x) => x.id === $("[name=productId]", r).value); if (p) { $("[name=price]", r).value = p.price; $("[name=cost]", r).value = productCost(p); recalc(); } }); };
  $$(".line", m).forEach(wire); $("[name=discount]", m).addEventListener("input", recalc);
  $("[name=paid]", m).addEventListener("change", () => { const p = $("[name=paid]", m).value === "1"; $("#tow", m).classList.toggle("hidden", !p); $("#cow", m).classList.toggle("hidden", p); });
  $("#addl", m).addEventListener("click", () => { $("#lines", m).insertAdjacentHTML("beforeend", lineHtml()); wire($("#lines", m).lastElementChild); });
  $("#of", m).addEventListener("submit", async (e) => {
    e.preventDefault(); const f = e.target; const btn = $("button[type=submit]", f); busy(btn, true);
    const items = $$(".line", m).map((r) => { const p = prods.find((x) => x.id === $("[name=productId]", r).value); return { productId: p ? p.id : "", name: p ? p.name : "", qty: Number($("[name=qty]", r).value), price: Number($("[name=price]", r).value), cost: Number($("[name=cost]", r).value) }; });
    try { await call("postEntry", { companyId: cid(), kind: "order", data: { date: f.date.value, channel: f.channel.value, campaignId: f.campaignId.value, items, discount: Number(f.discount.value) || 0, paid: f.paid.value === "1", toCode: f.toCode.value, contactId: f.contactId.value, customerName: f.customerName.value } }); closeModal(); toast(t("posted")); route(); }
    catch (ex) { $("#oerr", m).innerHTML = `<div class="err">${esc(ex.message)}</div>`; busy(btn, false); }
  });
}

/* ---------------- MATERIALS ---------------- */
VIEWS.materials = async (root) => {
  root.innerHTML = `<div class="panel"><h3>${t("materials")} ${writeBtn("+ " + t("new"), "new")}</h3>${S.materials.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>${t("name")}</th><th>${t("unit")}</th><th class="n">${t("unitCost")}</th><th>${t("supplier")}</th><th></th></tr></thead><tbody>
    ${S.materials.map((x) => { const s = S.contacts.find((c) => c.id === x.supplierId); return `<tr><td>${esc(x.name)}${x.notes ? `<div class="small muted">${esc(x.notes)}</div>` : ""}</td><td>${esc(x.unit)}</td><td class="n">${fmt(x.unitCost)}</td><td>${s ? esc(s.name) : "—"}</td><td class="act">${canWrite() ? `<button data-edit="${x.id}">${t("edit")}</button><button data-del="${x.id}">${t("delete")}</button>` : ""}</td></tr>`; }).join("")}
  </tbody></table></div>` : `<div class="empty">${t("noData")}</div>`}</div>`;
  $("[data-act=new]", root)?.addEventListener("click", () => materialForm());
  $$("[data-edit]", root).forEach((b) => b.addEventListener("click", () => materialForm(S.materials.find((x) => x.id === b.dataset.edit))));
  $$("[data-del]", root).forEach((b) => b.addEventListener("click", async () => { if (!confirm(t("confirmDel"))) return; try { await call("deleteRecord", { companyId: cid(), collection: "materials", id: b.dataset.del }); toast(t("deleted")); } catch (e) { toast(e.message, true); } }));
};
function materialForm(x = {}) {
  const m = openModal(`<h2>${t("materials")}<button data-close>×</button></h2><form id="mf">
    <div class="row"><div class="f"><label>${t("name")}</label><input name="name" value="${esc(x.name || "")}" required maxlength="120"></div><div class="f"><label>${t("unit")}</label><input name="unit" value="${esc(x.unit || (isAr() ? "غرام" : "gram"))}" maxlength="20"></div><div class="f"><label>${t("unitCost")}</label><input name="unitCost" type="number" step="0.0001" min="0" value="${x.unitCost || ""}" required></div></div>
    <div class="row"><div class="f"><label>${t("supplier")}</label><select name="supplierId"><option value="">—</option>${S.contacts.filter((c) => c.type !== "customer").map((c) => opt(c.id, c.name, x.supplierId)).join("")}</select></div><div class="f"><label>${t("notes")}</label><input name="notes" value="${esc(x.notes || "")}" maxlength="300"></div></div>
    <div id="merr"></div><div class="mfoot"><button type="button" class="btn btn-o" data-close>${t("cancel")}</button><button class="btn btn-p" type="submit">${t("save")}</button></div></form>`);
  $("#mf", m).addEventListener("submit", async (e) => {
    e.preventDefault(); const f = e.target; const btn = $("button[type=submit]", f); busy(btn, true);
    try { await call("saveRecord", { companyId: cid(), collection: "materials", id: x.id, data: { name: f.name.value, unit: f.unit.value, unitCost: Number(f.unitCost.value), supplierId: f.supplierId.value, notes: f.notes.value } }); closeModal(); toast(t("saved")); }
    catch (ex) { $("#merr", m).innerHTML = `<div class="err">${esc(ex.message)}</div>`; busy(btn, false); }
  });
}

/* ---------------- PRODUCTS & COSTING ---------------- */
VIEWS.products = async (root) => {
  root.innerHTML = `<div class="panel"><h3>${t("products")} ${writeBtn("+ " + t("new"), "new")}</h3>${S.products.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>${t("product")}</th><th class="n">${t("price")}</th><th class="n">${t("cost")}</th><th class="n">${t("margin")}</th><th class="n">${t("marginPct")}</th><th>${t("costMode")}</th><th></th></tr></thead><tbody>
    ${S.products.map((p) => { const c = productCost(p); const mg = money(p.price - c); return `<tr class="${p.active === false ? "muted" : ""}"><td>${esc(p.name)}${p.sku ? `<div class="small muted num">${esc(p.sku)}</div>` : ""}</td><td class="n">${fmt(p.price)}</td><td class="n">${fmt(c)}</td><td class="n ${mg < 0 ? "neg" : "pos"}">${fmt(mg)}</td><td class="n">${pct(p.price ? mg / p.price : NaN)}</td><td class="small">${t(p.costMode === "materials" ? "fromMaterials" : "manualCost")}</td><td class="act">${canWrite() ? `<button data-edit="${p.id}">${t("edit")}</button><button data-del="${p.id}">${t("delete")}</button>` : ""}</td></tr>`; }).join("")}
  </tbody></table></div>` : `<div class="empty">${t("noData")}</div>`}</div>`;
  $("[data-act=new]", root)?.addEventListener("click", () => productForm());
  $$("[data-edit]", root).forEach((b) => b.addEventListener("click", () => productForm(S.products.find((x) => x.id === b.dataset.edit))));
  $$("[data-del]", root).forEach((b) => b.addEventListener("click", async () => { if (!confirm(t("confirmDel"))) return; try { await call("deleteRecord", { companyId: cid(), collection: "products", id: b.dataset.del }); toast(t("deleted")); } catch (e) { toast(e.message, true); } }));
};
function productForm(p = {}) {
  const matLine = (ml = {}) => `<div class="line"><div><select name="materialId"><option value="">—</option>${S.materials.map((x) => opt(x.id, `${x.name} (${fmt(x.unitCost)}/${x.unit})`, ml.materialId)).join("")}</select></div><input name="mqty" type="number" step="0.001" min="0" placeholder="${t("matQty")}" value="${ml.qty || ""}"><div class="small muted num" data-sub>0.000</div><button type="button" class="x" data-x>×</button></div>`;
  const m = openModal(`<h2>${t("products")}<button data-close>×</button></h2><form id="pf">
    <div class="row"><div class="f"><label>${t("name")}</label><input name="name" value="${esc(p.name || "")}" required maxlength="120"></div><div class="f"><label>SKU</label><input name="sku" value="${esc(p.sku || "")}" maxlength="40" dir="ltr"></div><div class="f"><label>${t("unit")}</label><input name="unit" value="${esc(p.unit || (isAr() ? "قطعة" : "piece"))}" maxlength="20"></div></div>
    <div class="row"><div class="f"><label>${t("price")}</label><input name="price" type="number" step="0.001" min="0" value="${p.price || ""}" required></div><div class="f"><label>${t("costMode")}</label><select name="costMode">${opt("manual", t("manualCost"), p.costMode || "manual")}${opt("materials", t("fromMaterials"), p.costMode)}</select></div><div class="f" id="mcw"><label>${t("cost")}</label><input name="cost" type="number" step="0.001" min="0" value="${p.cost || ""}"></div></div>
    <div id="matw" class="${(p.costMode || "manual") === "materials" ? "" : "hidden"}"><div class="f"><label>${t("materials")}</label></div><div class="lines" id="mlines">${(p.materials && p.materials.length ? p.materials : [{}]).map(matLine).join("")}</div><div class="toolbar" style="margin-top:8px"><button type="button" class="btn btn-o btn-s" id="addm">${t("addLine")}</button></div></div>
    <div class="cards" style="margin:8px 0 0"><div class="card"><div class="k">${t("cost")}</div><div class="v sm num" id="pc">0.000</div></div><div class="card"><div class="k">${t("margin")}</div><div class="v sm num" id="pm">0.000</div></div><div class="card"><div class="k">${t("breakEvenPrice")}</div><div class="v sm num" id="pb">0.000</div><div class="sub">${isAr() ? "= التكلفة (سعر البيع لازم يكون أعلى منها)" : "= cost (price must exceed it)"}</div></div></div>
    <div id="prerr"></div><div class="mfoot"><button type="button" class="btn btn-o" data-close>${t("cancel")}</button><button class="btn btn-p" type="submit">${t("save")}</button></div></form>`);
  const cost = () => { if ($("[name=costMode]", m).value === "manual") return Number($("[name=cost]", m).value) || 0; let s = 0; $$("#mlines .line", m).forEach((r) => { const mat = S.materials.find((x) => x.id === $("[name=materialId]", r).value); const v = mat ? mat.unitCost * (Number($("[name=mqty]", r).value) || 0) : 0; $("[data-sub]", r).textContent = fmt(v); s += v; }); return money(s); };
  const recalc = () => { const c = cost(); const pr = Number($("[name=price]", m).value) || 0; $("#pc", m).textContent = fmt(c); $("#pm", m).textContent = fmt(pr - c) + " (" + pct(pr ? (pr - c) / pr : NaN) + ")"; $("#pm", m).className = "v sm num " + (pr - c < 0 ? "neg" : ""); $("#pb", m).textContent = fmt(c); };
  const wire = (r) => { $("[data-x]", r).addEventListener("click", () => { r.remove(); recalc(); }); $$("input,select", r).forEach((i) => i.addEventListener("input", recalc)); $$("select", r).forEach((i) => i.addEventListener("change", recalc)); };
  $$("#mlines .line", m).forEach(wire); $$("[name=price],[name=cost]", m).forEach((i) => i.addEventListener("input", recalc));
  $("[name=costMode]", m).addEventListener("change", () => { const mm = $("[name=costMode]", m).value === "materials"; $("#matw", m).classList.toggle("hidden", !mm); $("#mcw", m).classList.toggle("hidden", mm); recalc(); });
  $("#addm", m).addEventListener("click", () => { $("#mlines", m).insertAdjacentHTML("beforeend", matLine()); wire($("#mlines", m).lastElementChild); });
  recalc();
  $("#pf", m).addEventListener("submit", async (e) => {
    e.preventDefault(); const f = e.target; const btn = $("button[type=submit]", f); busy(btn, true);
    const materials = $$("#mlines .line", m).map((r) => ({ materialId: $("[name=materialId]", r).value, qty: Number($("[name=mqty]", r).value) || 0 })).filter((x) => x.materialId && x.qty > 0);
    try { await call("saveRecord", { companyId: cid(), collection: "products", id: p.id, data: { name: f.name.value, sku: f.sku.value, unit: f.unit.value, price: Number(f.price.value), costMode: f.costMode.value, cost: f.costMode.value === "manual" ? Number(f.cost.value) || 0 : cost(), materials } }); closeModal(); toast(t("saved")); }
    catch (ex) { $("#prerr", m).innerHTML = `<div class="err">${esc(ex.message)}</div>`; busy(btn, false); }
  });
}

/* ---------------- CAMPAIGNS (influencer ads / exhibitions) ---------------- */
VIEWS.campaigns = async (root) => {
  const orders = (await loadDocs("orders", { limit: 2000 })).filter((o) => !o.void && o.campaignId);
  const stat = (c) => { const os = orders.filter((o) => o.campaignId === c.id); const rev = os.reduce((s, o) => s + o.total, 0), cost = os.reduce((s, o) => s + o.cost, 0); const unit = money(c.avgOrderValue - c.avgOrderCost); const be = unit > 0 ? Math.ceil(c.cost / unit) : null; const net = money(rev - cost - c.cost); return { n: os.length, rev, cost, be, net, roi: c.cost ? net / c.cost : NaN }; };
  root.innerHTML = `<div class="panel"><h3>${t("campaigns")} ${writeBtn("+ " + t("new"), "new")}</h3><div class="small muted" style="margin:-6px 0 12px">${isAr() ? "طلبات التعادل = تكلفة الحملة ÷ (متوسط قيمة الطلب − متوسط تكلفة الطلب). اربط كل طلب بالحملة من صفحة الطلبات لتحسب النتيجة الفعلية." : "Break-even orders = campaign cost ÷ (avg order value − avg order cost). Link orders to the campaign on the Orders page to track the real result."}</div>
    ${S.campaigns.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>${t("campaign")}</th><th>${t("type")}</th><th class="n">${t("campaignCost")}</th><th class="n">${t("breakEvenOrders")}</th><th class="n">${t("actualOrders")}</th><th class="n">${t("revenue")}</th><th class="n">${t("profit")}</th><th class="n">${t("roi")}</th><th></th></tr></thead><tbody>
    ${S.campaigns.map((c) => { const s = stat(c); return `<tr><td>${esc(c.name)}<div class="small muted num">${c.startDate || ""}${c.endDate ? " → " + c.endDate : ""}</div></td><td>${t(c.type)}</td><td class="n">${fmt(c.cost)}</td><td class="n">${s.be == null ? "—" : fmt0(s.be)}</td><td class="n ${s.be != null && s.n >= s.be ? "pos" : ""}">${fmt0(s.n)}</td><td class="n">${fmt(s.rev)}</td><td class="n ${s.net < 0 ? "neg" : "pos"}">${fmt(s.net)}</td><td class="n">${pct(s.roi)}</td><td class="act">${canWrite() ? `<button data-edit="${c.id}">${t("edit")}</button><button data-del="${c.id}">${t("delete")}</button>` : ""}</td></tr>`; }).join("")}
  </tbody></table></div>` : `<div class="empty">${t("noData")}</div>`}</div>`;
  $("[data-act=new]", root)?.addEventListener("click", () => campaignForm());
  $$("[data-edit]", root).forEach((b) => b.addEventListener("click", () => campaignForm(S.campaigns.find((x) => x.id === b.dataset.edit))));
  $$("[data-del]", root).forEach((b) => b.addEventListener("click", async () => { if (!confirm(t("confirmDel"))) return; try { await call("deleteRecord", { companyId: cid(), collection: "campaigns", id: b.dataset.del }); toast(t("deleted")); } catch (e) { toast(e.message, true); } }));
};
function campaignForm(c = {}) {
  const avgP = S.products.length ? money(S.products.reduce((s, p) => s + p.price, 0) / S.products.length) : 0;
  const avgC = S.products.length ? money(S.products.reduce((s, p) => s + productCost(p), 0) / S.products.length) : 0;
  const m = openModal(`<h2>${t("campaigns")}<button data-close>×</button></h2><form id="cf">
    <div class="row"><div class="f"><label>${t("name")}</label><input name="name" value="${esc(c.name || "")}" required maxlength="120"></div><div class="f"><label>${t("type")}</label><select name="type">${opt("ad", t("ad"), c.type || "ad")}${opt("exhibition", t("exhibition"), c.type)}${opt("store", t("store"), c.type)}</select></div><div class="f"><label>${t("campaignCost")}</label><input name="cost" type="number" step="0.001" min="0" value="${c.cost || ""}" required><div class="hint">${isAr() ? "سجّل المصروف نفسه أيضاً من صفحة المصروفات (6310 / 6320)" : "Also book the actual expense on the Expenses page (6310 / 6320)"}</div></div></div>
    <div class="row"><div class="f"><label>${t("avgOrderValue")}</label><input name="avgOrderValue" type="number" step="0.001" min="0" value="${c.avgOrderValue || avgP}"></div><div class="f"><label>${t("avgOrderCost")}</label><input name="avgOrderCost" type="number" step="0.001" min="0" value="${c.avgOrderCost || avgC}"></div><div class="f"><label>${t("breakEvenOrders")}</label><div class="v num" id="be" style="font-size:24px;color:var(--cc-purple);padding-top:6px">—</div></div></div>
    <div class="row"><div class="f"><label>${t("from")}</label><input name="startDate" type="date" value="${c.startDate || today()}"></div><div class="f"><label>${t("to")}</label><input name="endDate" type="date" value="${c.endDate || ""}"></div></div>
    <div class="f"><label>${t("notes")}</label><input name="notes" value="${esc(c.notes || "")}" maxlength="500"></div>
    <div id="cerr"></div><div class="mfoot"><button type="button" class="btn btn-o" data-close>${t("cancel")}</button><button class="btn btn-p" type="submit">${t("save")}</button></div></form>`);
  const recalc = () => { const u = (Number($("[name=avgOrderValue]", m).value) || 0) - (Number($("[name=avgOrderCost]", m).value) || 0); const cost = Number($("[name=cost]", m).value) || 0; $("#be", m).textContent = u > 0 ? fmt0(Math.ceil(cost / u)) : "—"; };
  $$("[name=cost],[name=avgOrderValue],[name=avgOrderCost]", m).forEach((i) => i.addEventListener("input", recalc)); recalc();
  $("#cf", m).addEventListener("submit", async (e) => {
    e.preventDefault(); const f = e.target; const btn = $("button[type=submit]", f); busy(btn, true);
    try { await call("saveRecord", { companyId: cid(), collection: "campaigns", id: c.id, data: { name: f.name.value, type: f.type.value, cost: Number(f.cost.value), avgOrderValue: Number(f.avgOrderValue.value), avgOrderCost: Number(f.avgOrderCost.value), startDate: f.startDate.value, endDate: f.endDate.value, notes: f.notes.value } }); closeModal(); toast(t("saved")); }
    catch (ex) { $("#cerr", m).innerHTML = `<div class="err">${esc(ex.message)}</div>`; busy(btn, false); }
  });
}

/* ---------------- REPORTS ---------------- */
function balances(journal, filterFn) {
  const b = {}; journal.forEach((j) => j.lines.forEach((l) => { if (filterFn && !filterFn(j)) return; b[l.code] = money((b[l.code] || 0) + l.debit - l.credit); })); return b;
}
function statements(periodJ, cumJ) {
  const accs = S.accounts; const acc = (code) => accs.find((a) => a.code === code) || {};
  const pB = balances(periodJ), cB = balances(cumJ);
  const sum = (bal, pred, sign) => accs.filter(pred).reduce((s, a) => s + sign * (bal[a.code] || 0), 0);
  const revenue = sum(pB, (a) => a.type === "revenue" && a.subtype !== "other", -1);
  const otherIncome = sum(pB, (a) => a.type === "revenue" && a.subtype === "other", -1);
  const cogs = sum(pB, (a) => a.type === "expense" && a.subtype === "cogs", 1);
  const finance = sum(pB, (a) => a.type === "expense" && a.stmt === "FinanceCosts", 1);
  const opex = sum(pB, (a) => a.type === "expense" && a.subtype !== "cogs" && a.stmt !== "FinanceCosts", 1);
  const net = money(revenue + otherIncome - cogs - opex - finance);
  const assets = accs.filter((a) => a.type === "asset").map((a) => ({ a, v: cB[a.code] || 0 })).filter((x) => Math.abs(x.v) > 0.0005);
  const liabs = accs.filter((a) => a.type === "liability").map((a) => ({ a, v: -(cB[a.code] || 0) })).filter((x) => Math.abs(x.v) > 0.0005);
  const equity = accs.filter((a) => a.type === "equity").map((a) => ({ a, v: -(cB[a.code] || 0) })).filter((x) => Math.abs(x.v) > 0.0005);
  const cumNet = money(sum(cB, (a) => a.type === "revenue", -1) - sum(cB, (a) => a.type === "expense", 1));
  const tA = assets.reduce((s, x) => s + x.v, 0), tL = liabs.reduce((s, x) => s + x.v, 0), tE = equity.reduce((s, x) => s + x.v, 0) + cumNet;
  return { pB, cB, revenue, otherIncome, cogs, opex, finance, net, gross: money(revenue - cogs), assets, liabs, equity, cumNet, tA, tL, tE, acc };
}
VIEWS.reports = async (root) => {
  const st = VIEWS.reports.st || (VIEWS.reports.st = { ...fyRange(S.company.fiscalYearStartMonth), tab: "pl", code: "" });
  const [periodJ, cumJ] = await Promise.all([loadJournal(st.from, st.to), loadJournal(null, st.to)]);
  const R = statements(periodJ, cumJ);
  const tabs = ["pl", "bs", "tb", "monthly", "ledgerOf", "aging"];
  root.innerHTML = `${dateFilterBar(st)}<div class="tabs" style="max-width:820px">${tabs.map((k) => `<button data-tab="${k}" class="${st.tab === k ? "on" : ""}">${t(k)}</button>`).join("")}</div><div id="rep"></div>`;
  bindDateFilter(root, st, route);
  $$("[data-tab]", root).forEach((b) => b.addEventListener("click", () => { st.tab = b.dataset.tab; route(); }));
  const rep = $("#rep", root); const row = (label, v, cls = "") => `<tr class="${cls}"><td>${label}</td><td class="n">${fmt(v)}</td></tr>`;
  const head = (title) => `<h3>${title} <span class="small muted">${st.from} → ${st.to} · KWD</span><button class="btn btn-o btn-s" onclick="window.print()">${t("print")}</button></h3>`;
  if (st.tab === "pl") {
    rep.innerHTML = `<div class="panel">${head(t("pl"))}<table class="tbl"><tbody>
      ${row(t("revenue"), R.revenue)}${row(t("cogs"), -R.cogs)}${row(t("grossProfit"), R.gross, "tot")}
      ${S.accounts.filter((a) => a.type === "expense" && a.subtype !== "cogs" && a.stmt !== "FinanceCosts" && Math.abs(R.pB[a.code] || 0) > 0.0005).map((a) => row(`&nbsp;&nbsp;${esc(accLabel(a))}`, -(R.pB[a.code] || 0))).join("")}
      ${row(t("opex"), -R.opex)}${row("Finance costs / " + (isAr() ? "عمولات بنكية" : "bank fees"), -R.finance)}${row(t("otherIncome"), R.otherIncome)}${row(t("netIncome"), R.net, "tot")}
    </tbody></table></div>`;
  } else if (st.tab === "bs") {
    const sec = (title, list, tot) => `<table class="tbl"><thead><tr><th colspan="2">${title}</th></tr></thead><tbody>${list.map((x) => row(esc(accLabel(x.a)), x.v)).join("")}${tot}</tbody></table>`;
    rep.innerHTML = `<div class="panel">${head(t("bs"))}<div class="rep-grid">
      <div>${sec(t("assets"), R.assets, row(t("total"), R.tA, "tot"))}</div>
      <div>${sec(t("liabilities"), R.liabs, row(t("total"), R.tL, "tot"))}${sec(t("equity"), R.equity.concat([{ a: { code: "", nameAr: "الأرباح المتراكمة (غير مقفلة)", nameEn: "Accumulated profit (unclosed)" }, v: R.cumNet }]), row(t("total"), R.tE, "tot"))}
      <table class="tbl"><tbody>${row(t("liabilities") + " + " + t("equity"), R.tL + R.tE, "tot")}</tbody></table>
      ${Math.abs(R.tA - R.tL - R.tE) > 0.0005 ? `<div class="err">${isAr() ? "غير متوازن — راجع القيود" : "Out of balance — review entries"}: ${fmt(R.tA - R.tL - R.tE)}</div>` : `<div class="ok">✓ ${isAr() ? "متوازن" : "Balanced"}</div>`}</div></div></div>`;
  } else if (st.tab === "tb") {
    let td = 0, tc = 0;
    rep.innerHTML = `<div class="panel">${head(t("tb"))}<table class="tbl"><thead><tr><th>${t("account")}</th><th class="n">${t("debit")}</th><th class="n">${t("credit")}</th></tr></thead><tbody>
      ${S.accounts.map((a) => { const v = R.cB[a.code] || 0; if (Math.abs(v) < 0.0005) return ""; const d = v > 0 ? v : 0, c = v < 0 ? -v : 0; td += d; tc += c; return `<tr><td>${esc(accLabel(a))}</td><td class="n">${d ? fmt(d) : ""}</td><td class="n">${c ? fmt(c) : ""}</td></tr>`; }).join("")}
      <tr class="tot"><td>${t("total")}</td><td class="n">${fmt(td)}</td><td class="n">${fmt(tc)}</td></tr></tbody></table><div class="small muted" style="margin-top:8px">${isAr() ? "أرصدة تراكمية حتى تاريخ النهاية" : "Cumulative balances as of the end date"}</div></div>`;
  } else if (st.tab === "monthly") {
    const months = []; let d = new Date(st.from + "T12:00:00Z"); const end = new Date(st.to + "T12:00:00Z");
    while (d <= end && months.length < 12) { months.push(d.toISOString().slice(0, 7)); d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 12)); }
    const agg = {}; months.forEach((m) => (agg[m] = { rev: 0, cogs: 0, opex: 0, cin: 0, cout: 0 }));
    periodJ.forEach((j) => { const m = agg[monthKey(j.date)]; if (!m) return; j.lines.forEach((l) => { const a = R.acc(l.code); if (a.type === "revenue") m.rev += l.credit - l.debit; else if (a.type === "expense") { if (a.subtype === "cogs") m.cogs += l.debit - l.credit; else m.opex += l.debit - l.credit; } if (a.type === "asset" && ["cash", "bank"].includes(a.subtype)) { m.cin += l.debit; m.cout += l.credit; } }); });
    const line = (label, f, cls = "") => `<tr class="${cls}"><td>${label}</td>${months.map((m) => `<td class="n">${fmt(f(agg[m]))}</td>`).join("")}<td class="n">${fmt(months.reduce((s, m) => s + f(agg[m]), 0))}</td></tr>`;
    rep.innerHTML = `<div class="panel">${head(t("monthly"))}<div class="scroll"><table class="tbl month-tbl"><thead><tr><th></th>${months.map((m) => `<th class="n">${m}</th>`).join("")}<th class="n">${t("total")}</th></tr></thead><tbody>
      ${line(t("revenue"), (x) => x.rev)}${line(t("cogs"), (x) => -x.cogs)}${line(t("grossProfit"), (x) => x.rev - x.cogs, "tot")}${line(t("opex"), (x) => -x.opex)}${line(t("netIncome"), (x) => x.rev - x.cogs - x.opex, "tot")}
      ${line(t("cashIn"), (x) => x.cin)}${line(t("cashOut"), (x) => -x.cout)}${line(t("cashNet"), (x) => x.cin - x.cout, "tot")}
    </tbody></table></div></div>`;
  } else if (st.tab === "ledgerOf") {
    const code = st.code || (S.accounts[1] && S.accounts[1].code) || "";
    const rows = (await loadJournal(st.from, st.to, code));
    const openingJ = await loadJournal(null, addDays(st.from, -1), code);
    let bal = money(openingJ.reduce((s, j) => s + j.lines.filter((l) => l.code === code).reduce((x, l) => x + l.debit - l.credit, 0), 0));
    rep.innerHTML = `<div class="panel">${head(t("ledgerOf"))}<div class="toolbar"><select id="lsel">${S.accounts.map((a) => opt(a.code, accLabel(a), code)).join("")}</select></div><div class="scroll"><table class="tbl"><thead><tr><th>${t("date")}</th><th>#</th><th>${t("memo")}</th><th class="n">${t("debit")}</th><th class="n">${t("credit")}</th><th class="n">${t("balance")}</th></tr></thead><tbody>
      <tr class="hd"><td colspan="5">${isAr() ? "رصيد افتتاحي" : "Opening balance"}</td><td class="n">${fmt(bal)}</td></tr>
      ${rows.map((j) => j.lines.filter((l) => l.code === code).map((l) => { bal = money(bal + l.debit - l.credit); return `<tr><td class="num">${j.date}</td><td>${j.number}</td><td>${esc(j.memo)}${l.memo ? ` — ${esc(l.memo)}` : ""}</td><td class="n">${l.debit ? fmt(l.debit) : ""}</td><td class="n">${l.credit ? fmt(l.credit) : ""}</td><td class="n">${fmt(bal)}</td></tr>`; }).join("")).join("")}
    </tbody></table></div></div>`;
    $("#lsel", rep).addEventListener("change", (e) => { st.code = e.target.value; route(); });
  } else if (st.tab === "aging") {
    const invs = (await loadDocs("invoices", { limit: 1000 })).filter((i) => !i.void && i.status !== "paid");
    const exps = (await loadDocs("expenses", { limit: 1000 })).filter((x) => !x.void && x.paidFrom === "credit" && x.status !== "paid");
    const overdue = (d) => Math.max(0, Math.round((new Date(today()) - new Date(d)) / 86400000));
    rep.innerHTML = `<div class="panel">${head(t("aging"))}<div class="rep-grid"><div><h3 class="small">${t("recvBal")}</h3><table class="tbl"><thead><tr><th>${t("customer")}</th><th>#</th><th>${t("dueDate")}</th><th class="n">${t("remaining")}</th><th class="n">${isAr() ? "أيام التأخير" : "Days late"}</th></tr></thead><tbody>${invs.map((i) => `<tr><td>${esc(i.contactName)}</td><td>${i.number}</td><td class="num">${i.dueDate}</td><td class="n">${fmt(i.total - i.paid)}</td><td class="n ${overdue(i.dueDate) > 0 ? "neg" : ""}">${overdue(i.dueDate)}</td></tr>`).join("") || `<tr><td colspan="5" class="empty">${t("noData")}</td></tr>`}<tr class="tot"><td colspan="3">${t("total")}</td><td class="n">${fmt(invs.reduce((s, i) => s + i.total - i.paid, 0))}</td><td></td></tr></tbody></table></div>
      <div><h3 class="small">${t("payBal")}</h3><table class="tbl"><thead><tr><th>${t("supplier")}</th><th>#</th><th>${t("date")}</th><th class="n">${t("remaining")}</th></tr></thead><tbody>${exps.map((x) => `<tr><td>${esc(x.supplierName)}</td><td>${x.number}</td><td class="num">${x.date}</td><td class="n">${fmt(x.amount - x.paid)}</td></tr>`).join("") || `<tr><td colspan="4" class="empty">${t("noData")}</td></tr>`}<tr class="tot"><td colspan="3">${t("total")}</td><td class="n">${fmt(exps.reduce((s, x) => s + x.amount - x.paid, 0))}</td></tr></tbody></table></div></div></div>`;
  }
};

/* ---------------- XBRL / year-end export ---------------- */
let xlsxReady = null;
function loadXLSX() { if (!xlsxReady) xlsxReady = new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); return xlsxReady; }
VIEWS.xbrl = async (root) => {
  const st = VIEWS.xbrl.st || (VIEWS.xbrl.st = fyRange(S.company.fiscalYearStartMonth));
  root.innerHTML = `<div class="panel"><h3>${t("xbrl")}</h3><p class="muted" style="margin-top:0">${t("xbrlNote")}</p>${dateFilterBar(st)}<button class="btn btn-g" id="gen">${t("generate")}</button><div id="xmsg" style="margin-top:12px"></div></div>`;
  bindDateFilter(root, st, () => {});
  $("#gen", root).addEventListener("click", async () => {
    const btn = $("#gen", root); busy(btn, true);
    try {
      st.from = $("#dfrom", root).value; st.to = $("#dto", root).value;
      await loadXLSX();
      const [periodJ, cumJ] = await Promise.all([loadJournal(st.from, st.to), loadJournal(null, st.to)]);
      const R = statements(periodJ, cumJ);
      const wb = XLSX.utils.book_new();
      const groupBy = (list) => { const g = {}; list.forEach((x) => { const k = x.a.stmt || "Other"; g[k] = money((g[k] || 0) + x.v); }); return g; };
      const gA = groupBy(R.assets), gL = groupBy(R.liabs), gE = groupBy(R.equity.concat([{ a: { stmt: "RetainedEarnings" }, v: R.cumNet }]));
      const xb = (stmt) => (S.accounts.find((a) => a.stmt === stmt) || {}).xbrl || "";
      const sfp = [["Statement of financial position", S.company.name, `${st.from} → ${st.to}`, "KWD"], [], ["Line", "XBRL element", "Amount"], ["ASSETS"], ...Object.entries(gA).map(([k, v]) => [k, xb(k), v]), ["Total assets", "ifrs-full:Assets", money(R.tA)], [], ["LIABILITIES"], ...Object.entries(gL).map(([k, v]) => [k, xb(k), v]), ["Total liabilities", "ifrs-full:Liabilities", money(R.tL)], [], ["EQUITY"], ...Object.entries(gE).map(([k, v]) => [k, xb(k), v]), ["Total equity", "ifrs-full:Equity", money(R.tE)], [], ["Total liabilities and equity", "ifrs-full:EquityAndLiabilities", money(R.tL + R.tE)]];
      const pl = [["Statement of profit or loss", S.company.name, `${st.from} → ${st.to}`, "KWD"], [], ["Line", "XBRL element", "Amount"], ["Revenue", "ifrs-full:Revenue", money(R.revenue)], ["Cost of sales", "ifrs-full:CostOfSales", money(-R.cogs)], ["Gross profit", "ifrs-full:GrossProfit", money(R.gross)], ["Other income", "ifrs-full:OtherIncome", money(R.otherIncome)], ["Operating expenses", "ifrs-full:OtherExpenseByNature", money(-R.opex)], ["Finance costs", "ifrs-full:FinanceCosts", money(-R.finance)], ["Profit (loss) for the period", "ifrs-full:ProfitLoss", money(R.net)]];
      const tb = [["Code", "Account (AR)", "Account (EN)", "Type", "Debit", "Credit"], ...S.accounts.map((a) => { const v = R.cB[a.code] || 0; return [a.code, a.nameAr, a.nameEn || "", a.type, v > 0 ? v : 0, v < 0 ? -v : 0]; }).filter((r) => r[4] || r[5])];
      const map = [["Code", "Account (AR)", "Account (EN)", "Type", "Statement line", "XBRL element"], ...S.accounts.map((a) => [a.code, a.nameAr, a.nameEn || "", a.type, a.stmt || "", a.xbrl || ""])];
      [["SFP", sfp], ["PL", pl], ["TrialBalance", tb], ["Mapping", map]].forEach(([n, d]) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(d), n));
      XLSX.writeFile(wb, `CashDaftar_${S.company.name.replace(/[^\w\u0600-\u06FF]+/g, "_")}_${st.from}_${st.to}.xlsx`);
      $("#xmsg", root).innerHTML = `<div class="ok">✓ ${isAr() ? "تم توليد الملف" : "File generated"}</div>`;
    } catch (e) { $("#xmsg", root).innerHTML = `<div class="err">${esc(e.message)}</div>`; } finally { busy(btn, false); }
  });
};

/* ---------------- BILLING ---------------- */
VIEWS.billing = async (root) => {
  const sub = S.company.subscription; const P = S.plans;
  const hist = (await getDocs(query(collection(db, `companies/${cid()}/billing`), orderBy("paidAt", "desc"), limit(50)))).docs.map((d) => ({ id: d.id, ...d.data() }));
  const feats = ["planF1", "planF2", "planF3", "planF4"].map((k) => `<li>${t(k)}</li>`).join("");
  root.innerHTML = `<div class="panel"><h3>${t("billing")}</h3><div class="cards"><div class="card"><div class="k">${t("status")}</div><div class="v sm">${sub.active ? t(sub.status === "trial" ? "trial" : "active") : t("expired")}</div><div class="sub">${sub.periodEnd ? `${t("until")} ${sub.periodEnd.slice(0, 10)}` : ""}</div></div><div class="card"><div class="k">${isAr() ? "الباقة" : "Plan"}</div><div class="v sm">${sub.plan ? t(sub.plan + "Plan") : "—"}</div></div></div>
    ${isOwner() ? `<h3>${t("plansTitle")}</h3><div class="plans">
      <div class="plan"><div class="k">${t("monthlyPlan")}</div><div class="p"><span class="num">${P.monthly.price}</span> <small>${t("perMonth")}</small></div><ul>${feats}</ul><button class="btn btn-p btn-block" data-plan="monthly">${t("pay")}</button></div>
      <div class="plan best"><div class="badge">${t("bestValue")}</div><div class="k">${t("annualPlan")}</div><div class="p"><span class="num">${P.annual.price}</span> <small>${t("perYear")}</small></div><ul>${feats}</ul><button class="btn btn-g btn-block" data-plan="annual">${t("pay")}</button></div>
    </div><div class="small muted" style="margin-top:10px">${isAr() ? "الدفع عبر Tap (KNET / بطاقة). كل دفعة تضيف المدة على نهاية اشتراكك الحالي — بدون تجديد تلقائي في هذه النسخة." : "Paid via Tap (KNET / card). Each payment extends your current period end — no auto-renewal in this version."}</div><div id="berr"></div>` : `<div class="muted">${isAr() ? "المالك فقط يقدر يجدد الاشتراك" : "Only the owner can renew"}</div>`}
  </div>
  <div class="panel"><h3>${t("history")}</h3>${hist.length ? `<table class="tbl"><thead><tr><th>${t("date")}</th><th>${isAr() ? "الباقة" : "Plan"}</th><th class="n">${t("amount")}</th><th>${t("until")}</th><th>Tap</th></tr></thead><tbody>${hist.map((h) => `<tr><td class="num">${h.paidAt ? h.paidAt.toDate().toISOString().slice(0, 10) : ""}</td><td>${t(h.plan + "Plan")}</td><td class="n">${fmt(h.amount)}</td><td class="num">${h.periodEnd ? h.periodEnd.toDate().toISOString().slice(0, 10) : ""}</td><td class="small num">${esc(h.tapChargeId || "")}</td></tr>`).join("")}</tbody></table>` : `<div class="empty">${t("noData")}</div>`}</div>
  ${isOwner() ? `<div class="panel"><h3>${t("members")} <button class="btn btn-o btn-s" id="inv">${t("invite")}</button></h3><div id="mem">…</div></div>` : ""}`;
  $$("[data-plan]", root).forEach((b) => b.addEventListener("click", async () => { busy(b, true); try { const r = await call("createSubscriptionCharge", { companyId: cid(), plan: b.dataset.plan }); location.href = r.url; } catch (e) { $("#berr", root).innerHTML = `<div class="err">${esc(e.message)}</div>`; busy(b, false); } }));
  if (isOwner()) {
    const renderMembers = async () => {
      const r = await call("listMembers", { companyId: cid() });
      $("#mem", root).innerHTML = `<table class="tbl"><thead><tr><th>${t("email")}</th><th>${t("name")}</th><th>${t("role")}</th><th></th></tr></thead><tbody>${r.members.map((m) => `<tr><td dir="ltr">${esc(m.email)}</td><td>${esc(m.name || "")}</td><td>${t(m.role)}</td><td class="act">${m.role !== "owner" ? `<button data-rm="${m.uid}">${t("remove")}</button>` : ""}</td></tr>`).join("")}${r.invites.map((i) => `<tr class="muted"><td dir="ltr">${esc(i.email)}</td><td>${t("pending")}</td><td>${t(i.role)}</td><td class="act"><button data-rmi="${esc(i.email)}">${t("remove")}</button></td></tr>`).join("")}</tbody></table>`;
      $$("[data-rm]", root).forEach((b) => b.addEventListener("click", async () => { if (!confirm(t("confirmDel"))) return; await call("removeMember", { companyId: cid(), uid: b.dataset.rm }); renderMembers(); }));
      $$("[data-rmi]", root).forEach((b) => b.addEventListener("click", async () => { await call("removeMember", { companyId: cid(), email: b.dataset.rmi }); renderMembers(); }));
    };
    renderMembers();
    $("#inv", root).addEventListener("click", () => {
      const m = openModal(`<h2>${t("invite")}<button data-close>×</button></h2><form id="ivf"><div class="row"><div class="f"><label>${t("email")}</label><input name="email" type="email" required dir="ltr"></div><div class="f"><label>${t("role")}</label><select name="role">${opt("accountant", t("accountant"))}${opt("viewer", t("viewer"))}</select></div></div><div id="iverr"></div><div class="mfoot"><button type="button" class="btn btn-o" data-close>${t("cancel")}</button><button class="btn btn-p" type="submit">${t("invite")}</button></div></form>`);
      $("#ivf", m).addEventListener("submit", async (e) => { e.preventDefault(); const f = e.target; const btn = $("button[type=submit]", f); busy(btn, true); try { await call("inviteMember", { companyId: cid(), email: f.email.value, role: f.role.value }); closeModal(); toast(t("saved")); renderMembers(); } catch (ex) { $("#iverr", m).innerHTML = `<div class="err">${esc(ex.message)}</div>`; busy(btn, false); } });
    });
  }
};

/* ---------------- SETTINGS ---------------- */
VIEWS.settings = async (root) => {
  const c = S.company; const months = isAr() ? ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"] : ["January","February","March","April","May","June","July","August","September","October","November","December"];
  root.innerHTML = `<div class="panel"><h3>${t("settings")}</h3><form id="sf" style="max-width:640px">
    <div class="f"><label>${t("coName")}</label><input name="name" value="${esc(c.name)}" required maxlength="120" ${isOwner() ? "" : "disabled"}></div>
    <div class="row"><div class="f"><label>${t("crNumber")}</label><input name="crNumber" value="${esc(c.crNumber)}" maxlength="40" dir="ltr" ${isOwner() ? "" : "disabled"}></div><div class="f"><label>${t("phone")}</label><input name="phone" value="${esc(c.phone)}" maxlength="30" dir="ltr" ${isOwner() ? "" : "disabled"}></div></div>
    <div class="row"><div class="f"><label>${t("activity")}</label><input name="activity" value="${esc(c.activity)}" maxlength="120" ${isOwner() ? "" : "disabled"}></div><div class="f"><label>${t("fy")}</label><select name="fiscalYearStartMonth" ${isOwner() ? "" : "disabled"}>${months.map((m, i) => opt(String(i + 1), m, String(c.fiscalYearStartMonth))).join("")}</select></div></div>
    <div id="serr"></div>${isOwner() ? `<button class="btn btn-p" type="submit">${t("save")}</button>` : ""}</form>
    <div class="small muted" style="margin-top:18px">Company ID: <span class="num">${esc(c.id)}</span> · <a href="https://wa.me/${CFG.waNumber}" target="_blank" rel="noopener">${t("whatsapp")}</a></div></div>`;
  $("#sf", root).addEventListener("submit", async (e) => { e.preventDefault(); const f = e.target; const btn = $("button[type=submit]", f); busy(btn, true); try { await call("updateCompany", { companyId: cid(), data: { name: f.name.value, crNumber: f.crNumber.value, phone: f.phone.value, activity: f.activity.value, fiscalYearStartMonth: Number(f.fiscalYearStartMonth.value) } }); toast(t("saved")); await refreshCompany(); } catch (ex) { $("#serr", root).innerHTML = `<div class="err">${esc(ex.message)}</div>`; busy(btn, false); } });
};

/* ---------------- ADMIN (Cash Clinic) ---------------- */
VIEWS.admin = async (root) => {
  if (!S.isAdmin) { root.innerHTML = `<div class="err">admin only</div>`; return; }
  const r = await call("adminListCompanies");
  const render = (q = "") => {
    const list = r.companies.filter((c) => !q || (c.name + " " + c.ownerEmail + " " + c.crNumber).toLowerCase().includes(q.toLowerCase()));
    $("#adm", root).innerHTML = `<table class="tbl"><thead><tr><th>${t("coName")}</th><th>${t("owner")}</th><th>${t("status")}</th><th>${t("until")}</th><th class="n">${isAr() ? "قيود" : "Entries"}</th><th>${isAr() ? "تاريخ التسجيل" : "Created"}</th><th></th></tr></thead><tbody>
      ${list.map((c) => `<tr><td>${esc(c.name)}<div class="small muted num">${esc(c.crNumber || "")} · ${c.id}</div></td><td dir="ltr">${esc(c.ownerEmail)}</td><td><span class="pill ${c.subscription.active ? (c.subscription.status === "trial" ? "trial" : "active") : "expired"}">${c.subscription.active ? t(c.subscription.status === "trial" ? "trial" : "active") : t("expired")}${c.subscription.plan ? " · " + c.subscription.plan : ""}</span></td><td class="num">${c.subscription.periodEnd ? c.subscription.periodEnd.slice(0, 10) : "—"}</td><td class="n">${fmt0(c.counters.journal || 0)}</td><td class="num">${c.createdAt ? c.createdAt.slice(0, 10) : ""}</td><td class="act"><button data-days="${c.id}">${t("grantDays")}</button><button data-exp="${c.id}">${t("setExpired")}</button></td></tr>`).join("")}
    </tbody></table>`;
    $$("[data-days]", root).forEach((b) => b.addEventListener("click", async () => { const d = prompt(t("grantDays") + " (e.g. 30)", "30"); if (!d) return; try { await call("adminSetSubscription", { companyId: b.dataset.days, days: Number(d), note: "manual grant" }); toast(t("saved")); route(); } catch (e) { toast(e.message, true); } }));
    $$("[data-exp]", root).forEach((b) => b.addEventListener("click", async () => { if (!confirm(t("setExpired") + "?")) return; try { await call("adminSetSubscription", { companyId: b.dataset.exp, status: "expired", note: "manual expire" }); toast(t("saved")); route(); } catch (e) { toast(e.message, true); } }));
  };
  root.innerHTML = `<div class="cards"><div class="card"><div class="k">${t("companies")}</div><div class="v">${fmt0(r.companies.length)}</div></div><div class="card"><div class="k">${t("active")}</div><div class="v">${fmt0(r.companies.filter((c) => c.subscription.active && c.subscription.status !== "trial").length)}</div></div><div class="card"><div class="k">${t("trial")}</div><div class="v">${fmt0(r.companies.filter((c) => c.subscription.active && c.subscription.status === "trial").length)}</div></div><div class="card"><div class="k">${t("expired")}</div><div class="v">${fmt0(r.companies.filter((c) => !c.subscription.active).length)}</div></div></div>
    <div class="panel"><h3>${t("companies")}</h3><div class="toolbar"><input id="q" placeholder="${t("search")}"></div><div id="adm" class="scroll"></div></div>`;
  render(); $("#q", root).addEventListener("input", (e) => render(e.target.value));
};
