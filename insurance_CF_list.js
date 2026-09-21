   // ===== 组合利益演示状态 =====
  let comboMode = false;
  let comboSelectedIds = [];

  // 组合利益演示最多可选保单数
  const COMBO_MAX = 6;

  function updateComboStartBtn() {
    const btn = document.getElementById('comboStartBtn');
    if (!btn) return;
    const n = comboSelectedIds.length;
    btn.disabled = n < 2;
    btn.classList.toggle('active', n >= 2);
  }

  function toggleComboMode() {
    comboMode = !comboMode;
    comboSelectedIds = [];
    const btn = document.getElementById('comboModeBtn');
    const startBtn = document.getElementById('comboStartBtn');
    const seqHeader = document.getElementById('seqHeader');
    const actionHeader = document.getElementById('actionColHeader');
    const listAddBtn = document.getElementById('listAddBtn');
    if (comboMode) {
      btn.classList.add('active');
      btn.textContent = '✖ 退出组合';
      startBtn.style.display = 'inline-flex';
      seqHeader.textContent = '选择';
      if (actionHeader) actionHeader.style.visibility = '';
      if (listAddBtn) listAddBtn.style.display = 'none';
      document.body.classList.add('combo-mode');
    } else {
      btn.classList.remove('active');
      btn.textContent = '组合利益演示';
      startBtn.style.display = 'none';
      seqHeader.textContent = '序号';
      if (actionHeader) actionHeader.style.visibility = '';
      if (listAddBtn) listAddBtn.style.display = '';
      document.body.classList.remove('combo-mode');
      if (typeof _comboSelectedYear !== 'undefined') _comboSelectedYear = null;
    }
    updateComboStartBtn();
    renderTable();
  }

  function onComboCheck(id, el) {
    if (el.checked) {
      if (comboSelectedIds.length >= COMBO_MAX) {
        el.checked = false;
        alert('组合利益演示最多选择 ' + COMBO_MAX + ' 张保单');
        return;
      }
      comboSelectedIds.push(id);
    } else {
      comboSelectedIds = comboSelectedIds.filter(x => x !== id);
    }
    updateComboStartBtn();
    renderTable();
  }

  function openComboBenefitModal() {
    const m = document.getElementById('comboBenefitModal');
    if (m) m.classList.add('active');
  }

  function closeComboBenefitModal() {
    const m = document.getElementById('comboBenefitModal');
    if (m) m.classList.remove('active');
  }

  function startComboBenefit() {
    if (comboSelectedIds.length < 2) {
      alert('请至少选择两张保单');
      return;
    }
    const selected = comboSelectedIds.map(id => policies.find(p => p.id === id)).filter(Boolean);
    if (selected.length < 2) return;
    // 设置副标题：列出全部所选保单
    const sub = document.getElementById('comboBenefitSubtitle');
    if (sub) {
      const names = selected.map((p, i) => (p.productName || p.company || ('保单' + (i + 1))));
      const dates = selected.map(p => p.startDate || '-').join(' / ');
      sub.textContent = `组合（${selected.length} 张）：${names.join(' ＋ ')}（投保日期 ${dates}）`;
    }
    openComboBenefitModal();
    if (typeof renderComboBenefit === 'function') renderComboBenefit(selected);
  }

  function renderTable() {
    const filtered = getFilteredPolicies();
    const tbody = document.getElementById('tableBody');
    const emptyState = document.getElementById('emptyState');

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyState.style.display = 'block';
      if (currentView === 'waterfall') renderWaterfall();
      return;
    }

    emptyState.style.display = 'none';

    const sorted = [...filtered].sort((a, b) => {
      let valA, valB;
      if (sortField === 'paymentStatus') {
        valA = calcPaymentStatus(a.startDate, a.paymentTerm, baseDate) || '';
        valB = calcPaymentStatus(b.startDate, b.paymentTerm, baseDate) || '';
      } else if (sortField === 'paidYears') {
        valA = calcPaidYears(a.startDate, a.paymentTerm, baseDate);
        valB = calcPaidYears(b.startDate, b.paymentTerm, baseDate);
      } else if (sortField === 'coverage') {
        valA = formatCoverage(a);
        valB = formatCoverage(b);
      } else if (sortField === 'cumulativePremium') {
        valA = (parseFloat(a.annualPremium) || 0) * calcPaidYears(a.startDate, a.paymentTerm);
        valB = (parseFloat(b.annualPremium) || 0) * calcPaidYears(b.startDate, b.paymentTerm);
      } else {
        valA = a[sortField];
        valB = b[sortField];
      }
      if (['annualPremium', 'paymentTerm', 'sumAssured', 'paidYears', 'cumulativePremium'].includes(sortField)) {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      if (sortField === 'startDate') {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      valA = (valA || '').toString();
      valB = (valB || '').toString();
      return sortDirection === 'asc'
        ? valA.localeCompare(valB, 'zh-CN')
        : valB.localeCompare(valA, 'zh-CN');
    });

    updateSortIndicators();

    tbody.innerHTML = sorted.map((p, index) => {
      const paidYears = calcPaidYears(p.startDate, p.paymentTerm, baseDate);
      const checked = comboMode && comboSelectedIds.includes(p.id) ? 'checked' : '';
      let disabled = '';
      if (comboMode && comboSelectedIds.length >= COMBO_MAX && !comboSelectedIds.includes(p.id)) {
        disabled = 'disabled'; // 已选满上限，禁止再选
      }
      const seqCell = comboMode
        ? `<td style="text-align:center;"><input type="checkbox" class="combo-chk" data-id="${p.id}" ${checked} ${disabled} ${disabled ? 'title="最多选择 ' + COMBO_MAX + ' 张保单"' : ''} onchange="onComboCheck('${p.id}', this)"></td>`
        : `<td style="text-align:center;color:#9ca3af;">${index + 1}</td>`;
      const actionsCell = comboMode
        ? `<td><div class="actions"><button class="action-btn action-edit" disabled>详情</button><button class="action-btn action-delete" disabled>删除</button></div></td>`
        : `<td><div class="actions"><button class="action-btn action-edit" onclick="openDetailModal('${p.id}')">详情</button><button class="action-btn action-delete" onclick="openDeleteConfirm('${p.id}')">删除</button></div></td>`;
      return `
      <tr>
        ${seqCell}
        <td>${escapeHtml(p.company || '-')}</td>
        <td class="product-name-cell"><span class="product-name-text">${escapeHtml(p.productName || '-')}</span></td>
        <td><span class="tag tag-category-${p.productCategory || ''}" title="${p.productCategory || ''}">${CATEGORY_SHORT[p.productCategory] || p.productCategory || '-'}</span></td>
        <td><span class="tag tag-design-${p.designType || ''}" title="${p.designType || ''}">${DESIGN_SHORT[p.designType] || p.designType || '-'}</span></td>
        <td>${escapeHtml(p.insured || '-')}</td>
        <td>${p.startDate || '-'}</td>
        <td>${formatMoneyDisplay(parseFloat(p.annualPremium) || 0)}</td>
        <td>${p.paymentTerm ? p.paymentTerm + ' 年' : '-'}</td>
        <td>${formatCoverage(p)}</td>
        <td>${formatMoneyDisplay(parseFloat(p.sumAssured) || 0)}</td>
        <td>${renderStatusTags(p, baseDate)}</td>
        <td>${formatMoneyDisplay((parseFloat(p.annualPremium) || 0) * paidYears)}</td>
        <td>${renderBenefitColValue(p, document.getElementById('colBenefitMode').value)}</td>
        <td><span class="tag tag-channel">${escapeHtml(p.channel || '-')}</span></td>
        <td style="text-align:center;">${(p.cashValueImported || (p.designType === '万能型' && p.universalAccount && p.universalAccount.fundFlows && p.universalAccount.fundFlows.length > 0 && p.universalAccount.interestRates && p.universalAccount.interestRates.length > 0)) ? '✅' : ''}</td>
        ${actionsCell}
      </tr>
    `}).join('');

    adjustProductNameFont();
    renderStats(filtered);
    updateFilterCounts();
    if (currentView === 'calendar') renderCalendar();
    if (currentView === 'waterfall') renderWaterfall();
  }
