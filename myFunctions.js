/* ==========================================================
   myFunctions.js — ملف جافاسكريبت الوحيد (جميع التوابع هنا)
   يعتمد على مكتبة jQuery (jquery-3.6.0.min.js) المحمَّلة قبله.
   ========================================================== */

/* ---------- ثوابت الأعمال ---------- */
var DISCOUNT_DAYS = 7;      // الخصم يُطبَّق إذا تجاوزت المدة 7 أيام
var DISCOUNT_RATE = 0.10;   // نسبة الخصم 10%
var MS_PER_DAY = 24 * 60 * 60 * 1000;

/* ==========================================================
   أولاً: توابع مساعدة
   ========================================================== */

/* تنسيق الأرقام بفاصل الآلاف: 250000 -> 250,000 */
function formatNumber(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/* إظهار رسالة خطأ تحت حقل وتلوينه */
function setError(fieldId, message) {
  $("#" + fieldId).addClass("invalid");
  $("#err-" + fieldId).text(message);
}

/* مسح رسالة خطأ حقل واحد */
function clearError(fieldId) {
  $("#" + fieldId).removeClass("invalid");
  $("#err-" + fieldId).text("");
}

/* مسح جميع رسائل الأخطاء في النموذج */
function clearAllErrors() {
  var ids = ["fullName", "nationalId", "startDate", "endDate", "mobile", "email"];
  for (var i = 0; i < ids.length; i++) {
    clearError(ids[i]);
  }
  $("#formMsg").text("");
}

/* ==========================================================
   ثانياً: توابع التحقق من صحة المدخلات
   كل تابع يعيد نص الخطأ، أو "" إذا كانت القيمة صحيحة
   ========================================================== */

/* الاسم الكامل: أحرف هجائية عربية فقط (مسافات بين الكلمات مسموحة) — الحقل اختياري */
function validateFullName(value) {
  var v = $.trim(value);
  if (v === "") {
    return "";
  }
  var arabicWords = /^[ء-غف-ي]+(\s+[ء-غف-ي]+)*$/;
  if (!arabicWords.test(v)) {
    return "الاسم يجب أن يحتوي أحرفاً هجائية عربية فقط (دون أرقام أو رموز أو حروف لاتينية).";
  }
  return "";
}

/* الرقم الوطني: إلزامي، 11 خانة رقمية، أول خانتين رمز المحافظة من 01 إلى 14 */
function validateNationalId(value) {
  var v = $.trim(value);
  if (v === "") {
    return "الرقم الوطني حقل إلزامي.";
  }
  if (!/^\d+$/.test(v)) {
    return "الرقم الوطني يجب أن يتألف من أرقام فقط.";
  }
  if (v.length !== 11) {
    return "الرقم الوطني يجب أن يتألف من 11 خانة (المدخل: " + v.length + ").";
  }
  var gov = parseInt(v.substring(0, 2), 10);
  if (gov < 1 || gov > 14) {
    return "أول خانتين تمثلان رمز المحافظة ويجب أن تكونا بين 01 و14.";
  }
  return "";
}

/* تحويل نص بصيغة yyyy-mm-dd إلى تاريخ (UTC)، أو null إن كان غير صالح (مثل 2026-02-30) */
function parseDate(text) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec($.trim(text));
  if (m === null) {
    return null;
  }
  var y = parseInt(m[1], 10);
  var mo = parseInt(m[2], 10);
  var d = parseInt(m[3], 10);
  var date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

/* تاريخ واحد (بداية أو نهاية): إلزامي وبصيغة yyyy-mm-dd وتاريخ فعلي موجود */
function validateDateField(value, label) {
  var v = $.trim(value);
  if (v === "") {
    return label + " حقل إلزامي.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return "صيغة " + label + " يجب أن تكون yyyy-mm-dd (مثال: 2026-11-20).";
  }
  if (parseDate(v) === null) {
    return label + " غير موجود في التقويم.";
  }
  return "";
}

/* التسلسل الزمني: النهاية يجب أن تكون لاحقة للبداية */
function validateDateOrder(startText, endText) {
  var s = parseDate(startText);
  var e = parseDate(endText);
  if (s !== null && e !== null && e.getTime() <= s.getTime()) {
    return "تاريخ نهاية التأجير يجب أن يكون لاحقاً لتاريخ البداية.";
  }
  return "";
}

/* رقم الموبايل: اختياري. سيرياتل (093, 098, 099) أو MTN (094, 095, 096)
   يُقبل: 09XXXXXXXX أو +9639XXXXXXXX أو 009639XXXXXXXX */
function validateMobile(value) {
  var v = $.trim(value);
  if (v === "") {
    return "";
  }
  var syrian = /^(0|\+963|00963)9[345689]\d{7}$/;
  if (!syrian.test(v)) {
    return "رقم غير مطابق لشبكتي Syriatel (093، 098، 099) أو MTN (094، 095، 096). مثال: 0933123456.";
  }
  return "";
}

/* البريد الإلكتروني: اختياري، وإن وُجد فيجب أن يكون بصيغة صحيحة */
function validateEmail(value) {
  var v = $.trim(value);
  if (v === "") {
    return "";
  }
  var emailPattern = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/;
  if (!emailPattern.test(v)) {
    return "صيغة البريد الإلكتروني غير صحيحة (مثال: name@example.com).";
  }
  return "";
}

/* التحقق من جميع الحقول معاً. يعيد true إذا كان كل شيء صحيحاً */
function validateForm() {
  clearAllErrors();
  var ok = true;
  var firstBad = null;

  function check(fieldId, message) {
    if (message !== "") {
      setError(fieldId, message);
      ok = false;
      if (firstBad === null) {
        firstBad = fieldId;
      }
    }
  }

  check("fullName", validateFullName($("#fullName").val()));
  check("nationalId", validateNationalId($("#nationalId").val()));

  var startErr = validateDateField($("#startDate").val(), "تاريخ بداية التأجير");
  var endErr = validateDateField($("#endDate").val(), "تاريخ نهاية التأجير");
  check("startDate", startErr);
  check("endDate", endErr);
  if (startErr === "" && endErr === "") {
    check("endDate", validateDateOrder($("#startDate").val(), $("#endDate").val()));
  }

  check("mobile", validateMobile($("#mobile").val()));
  check("email", validateEmail($("#email").val()));

  if (firstBad !== null) {
    $("#" + firstBad).focus();
  }
  return ok;
}

/* ==========================================================
   ثالثاً: السيارات المختارة وحساب الأسعار
   ========================================================== */

/* قراءة السيارات المحددة في الجدول: مصفوفة كائنات {code, model, price} */
function getSelectedCars() {
  var cars = [];
  $("input.chk-select:checked").each(function () {
    var row = $(this).closest("tr");
    cars.push({
      code: $.trim(row.find("td.code").text()),
      model: $.trim(row.find("td.model").text()),
      price: parseInt($(this).val(), 10)
    });
  });
  return cars;
}

/* عدد أيام التأجير = الفرق بين النهاية والبداية */
function countDays(startText, endText) {
  var s = parseDate(startText);
  var e = parseDate(endText);
  return Math.round((e.getTime() - s.getTime()) / MS_PER_DAY);
}

/* حساب الفاتورة: لكل سيارة (السعر × الأيام)، ثم المجموع، ثم خصم 10% إذا تجاوزت المدة 7 أيام */
function calculateBooking(cars, days) {
  var lines = [];
  var subtotal = 0;
  for (var i = 0; i < cars.length; i++) {
    var lineTotal = cars[i].price * days;
    subtotal += lineTotal;
    lines.push({ car: cars[i], days: days, lineTotal: lineTotal });
  }
  var hasDiscount = days > DISCOUNT_DAYS;
  var discount = hasDiscount ? subtotal * DISCOUNT_RATE : 0;
  return {
    lines: lines,
    subtotal: subtotal,
    hasDiscount: hasDiscount,
    discount: discount,
    total: subtotal - discount
  };
}

/* تحديث قائمة «السيارات المختارة» داخل النموذج */
function updateSelectedList() {
  var cars = getSelectedCars();
  var list = $("#selectedList");
  list.empty();
  if (cars.length === 0) {
    list.append($("<li></li>").text("لم تُختر أي سيارة بعد."));
    return;
  }
  for (var i = 0; i < cars.length; i++) {
    list.append($("<li></li>").text(cars[i].code + " — " + cars[i].model + " (" + formatNumber(cars[i].price) + " ل.س / يوم)"));
  }
}

/* ==========================================================
   رابعاً: نافذة النتيجة
   ========================================================== */

function showResultWindow() {
  var cars = getSelectedCars();
  var startText = $.trim($("#startDate").val());
  var endText = $.trim($("#endDate").val());
  var days = countDays(startText, endText);
  var result = calculateBooking(cars, days);

  var name = $.trim($("#fullName").val());
  var box = $("#resultContent");
  box.empty();

  box.append($("<p class='summary-line'></p>").text("مقدم الطلب: " + (name === "" ? "—" : name)));
  box.append($("<p class='summary-line'></p>").text("الفترة: من " + startText + " إلى " + endText + " (" + days + " يوم)"));

  var table = $("<table></table>");
  table.append("<thead><tr><th>السيارة</th><th>السعر اليومي (ل.س)</th><th>عدد أيام التأجير</th><th>المجموع (ل.س)</th></tr></thead>");
  var body = $("<tbody></tbody>");
  for (var i = 0; i < result.lines.length; i++) {
    var L = result.lines[i];
    var tr = $("<tr></tr>");
    tr.append($("<td></td>").text(L.car.code + " — " + L.car.model));
    tr.append($("<td></td>").text(formatNumber(L.car.price)));
    tr.append($("<td></td>").text(L.days));
    tr.append($("<td></td>").text(formatNumber(L.lineTotal)));
    body.append(tr);
  }
  var r1 = $("<tr></tr>").append($("<td colspan='3'></td>").text("المجموع قبل الخصم")).append($("<td></td>").text(formatNumber(result.subtotal)));
  var discText = result.hasDiscount
    ? "الخصم 10% (المدة أكثر من " + DISCOUNT_DAYS + " أيام)"
    : "الخصم (لا يوجد — المدة " + DISCOUNT_DAYS + " أيام أو أقل)";
  var r2 = $("<tr></tr>").append($("<td colspan='3'></td>").text(discText)).append($("<td></td>").text(formatNumber(result.discount)));
  var r3 = $("<tr class='total'></tr>").append($("<td colspan='3'></td>").text("المبلغ الإجمالي النهائي")).append($("<td></td>").text(formatNumber(result.total) + " ل.س"));
  body.append(r1).append(r2).append(r3);
  table.append(body);
  box.append($("<div class='table-wrap'></div>").append(table));

  $("#resultOverlay").fadeIn(200);
}

function closeResultWindow() {
  $("#resultOverlay").fadeOut(150);
}

/* ==========================================================
   خامساً: تهيئة الصفحات (تعمل بعد تحميل الصفحة)
   ========================================================== */

/* مشتركة بين جميع الصفحات: تمييز الصفحة الحالية، زر الخروج، ظهور تدريجي */
function initCommon() {
  var page = window.location.pathname.split("/").pop().toLowerCase();
  if (page === "") {
    page = "Index.html";
  }
  $("#nav li:not(.exit) a").each(function () {
    if ($(this).attr("href").toLowerCase() === page) {
      $(this).addClass("active");
    }
  });

  $("#exitLink").click(function (event) {
    var leave = window.confirm("هل تريد الخروج والعودة إلى الصفحة الرئيسية؟");
    if (!leave) {
      event.preventDefault();
    }
  });

  $("div.card").not("#bookingBox").hide().each(function (index) {
    $(this).delay(index * 120).fadeIn(450);
  });
}

/* صفحة Index.html: إظهار/إخفاء الملاحظات */
function initIndexPage() {
  $("#toggleNotes").click(function () {
    $("#notesBox").slideToggle(250);
  });
}

/* صفحة AboutUs.html: تمييز الفرع عند المرور عليه */
function initAboutPage() {
  $("#branchTable tbody tr").hover(
    function () { $(this).find("td").css("background-color", "#eaf6f3"); },
    function () { $(this).find("td").css("background-color", ""); }
  );
}

/* صفحة Cars.html */
function initCarsPage() {
  /* نموذج بدون التحقق الافتراضي للمتصفح (نعتمد على تحققنا بجافاسكريبت) */
  $("#bookingForm").attr("novalidate", "novalidate");

  /* نصوص توضيحية داخل الحقول */
  $("#fullName").attr("placeholder", "مثال: أحمد محمد الخطيب");
  $("#nationalId").attr("placeholder", "11 رقماً، يبدأ بـ 01 إلى 14");
  $("#startDate").attr("placeholder", "yyyy-mm-dd");
  $("#endDate").attr("placeholder", "yyyy-mm-dd");
  $("#mobile").attr("placeholder", "09XXXXXXXX");
  $("#email").attr("placeholder", "name@example.com");

  /* تنسيق الأسعار بفاصل الآلاف */
  $("span.num").each(function () {
    $(this).text(formatNumber(parseInt($(this).text(), 10)));
  });

  /* (jQuery) إظهار/إخفاء التفاصيل: يمكن إظهار تفاصيل عدة سيارات معاً */
  $("input.chk-details").click(function () {
    var box = $("#det-" + $(this).val() + " .details-box");
    if ($(this).is(":checked")) {
      box.slideDown(250);
    } else {
      box.slideUp(250);
    }
  });

  /* اختيار السيارات */
  $("input.chk-select").click(function () {
    $(this).closest("tr").toggleClass("selected", $(this).is(":checked"));
    $("#selMsg").text("");
    updateSelectedList();
  });

  /* زر متابعة: يُظهر النموذج في نفس الصفحة بعد اختيار سيارة واحدة على الأقل */
  $("#btnContinue").click(function () {
    if (getSelectedCars().length === 0) {
      $("#selMsg").text("يرجى اختيار سيارة واحدة على الأقل قبل المتابعة.");
      return;
    }
    $("#selMsg").text("");
    updateSelectedList();
    $("#bookingBox").slideDown(300, function () {
      $("html, body").animate({ scrollTop: $("#bookingBox").offset().top - 20 }, 300);
    });
  });

  /* إزالة رسالة الخطأ أثناء تصحيح الحقل */
  $("#bookingForm input[type='text']").on("input", function () {
    clearError($(this).attr("id"));
  });

  /* إرسال النموذج */
  $("#bookingForm").submit(function (event) {
    event.preventDefault();
    if (getSelectedCars().length === 0) {
      $("#formMsg").text("لم تُختر أي سيارة. ارجع إلى الجدول واختر سيارة واحدة على الأقل.");
      return;
    }
    if (validateForm()) {
      showResultWindow();
    } else {
      $("#formMsg").text("يرجى تصحيح الحقول المظللة بالأحمر ثم إعادة الإرسال.");
    }
  });

  $("#bookingForm").on("reset", function () {
    clearAllErrors();
  });

  /* إغلاق نافذة النتيجة */
  $("#btnCloseResult").click(closeResultWindow);
  $("#resultOverlay").click(function (event) {
    if (event.target === this) {
      closeResultWindow();
    }
  });
  $(document).keyup(function (event) {
    if (event.which === 27) {
      closeResultWindow();
    }
  });
}

/* نقطة الدخول: تُستدعى عند اكتمال تحميل الصفحة */
$(document).ready(function () {
  initCommon();
  if ($("#toggleNotes").length) { initIndexPage(); }
  if ($("#branchTable").length) { initAboutPage(); }
  if ($("#carsTable").length) { initCarsPage(); }
});
