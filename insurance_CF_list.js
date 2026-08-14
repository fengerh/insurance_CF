   // ===== 组合利益演示状态 =====
  let comboMode = false;
  let comboSelectedIds = [];

  function comboDateDiffYears(a, b) {
    const d1 = a && a.startDate ? new Date(a.startDate).getTime() : NaN;
    const d2 = b && b.startDate ? new Date(b.startDate).getTime() : NaN;
    if (isNaN(d1) || isNaN(d2)) return Infinity;
    return Math.abs((d1 - d2) / (365.25 * 24 * 3600 * 1000));
  }

  function comboDateOk(a, b) {
    return comboDateDiffYears(a, b) <= 1;
  }

  function updateComboStartBtn() {
    const btn = document.getElementById('comboStartBtn');
    if (!btn) return;
    btn.disabled = comboSelectedIds.length !== 2;
    btn.classList.toggle('active', comboSelectedIds.length === 2);
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
      if (comboSelectedIds.length >= 2) {
        el.checked = false;
        alert('组合利益演示最多选择两个保单');
        return;
      }
      if (comboSelectedIds.length === 1) {
        const prev = policies.find(p => p.id === comboSelectedIds[0]);
        const cur = policies.find(p => p.id === id);
        if (prev && cur && !comboDateOk(prev, cur)) {
          el.checked = false;
          alert('两张保单投保日期相差不能超过 1 年，无法组合演示');
          return;
        }
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
    if (comboSelectedIds.length !== 2) {
      alert('请先选择两个保单');
      return;
    }
    const selected = comboSelectedIds.map(id => policies.find(p => p.id === id)).filter(Boolean);
    if (selected.length !== 2) return;
    if (!comboDateOk(selected[0], selected[1])) {
      alert('两张保单投保日期相差不能超过 1 年，无法组合演示');
      return;
    }
    // 设置副标题
    const sub = document.getElementById('comboBenefitSubtitle');
    if (sub) {
      sub.textContent = `组合：${selected[0].productName || selected[0].company || '保单1'} ＋ ${selected[1].productName || selected[1].company || '保单2'}` +
        `（投保日期 ${selected[0].startDate || '-'} / ${selected[1].startDate || '-'}）`;
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
      if (comboMode) {
        if (comboSelectedIds.length >= 2 && !comboSelectedIds.includes(p.id)) {
          disabled = 'disabled'; // 已选两张，禁止再选第三张
        } else if (comboSelectedIds.length === 1 && !comboSelectedIds.includes(p.id)) {
          const baseP = policies.find(x => x.id === comboSelectedIds[0]);
          if (baseP && !comboDateOk(baseP, p)) {
            disabled = 'disabled'; // 与首张保单投保日期相差超过 1 年，置灰
          }
        }
      }
      const seqCell = comboMode
        ? `<td style="text-align:center;"><input type="checkbox" class="combo-chk" data-id="${p.id}" ${checked} ${disabled} ${disabled ? 'title="投保日期与已选保单相差超过 1 年，不可组合"' : ''} onchange="onComboCheck('${p.id}', this)"></td>`
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
