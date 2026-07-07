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
      return `
      <tr>
        <td style="text-align:center;color:#9ca3af;">${index + 1}</td>
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
        <td>
          <div class="actions">
            <button class="action-btn action-edit" onclick="openDetailModal('${p.id}')">详情</button>
            <button class="action-btn action-delete" onclick="openDeleteConfirm('${p.id}')">删除</button>
          </div>
        </td>
      </tr>
    `}).join('');

    adjustProductNameFont();
    renderStats(filtered);
    updateFilterCounts();
    if (currentView === 'calendar') renderCalendar();
    if (currentView === 'waterfall') renderWaterfall();
  }
