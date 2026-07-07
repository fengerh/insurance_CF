  // ===== 万能账户计算引擎 =====
  let _uaCache = {}; // { policyId: { annualRows: [...], summary } }
  function handleUAFieldChange() { /* placeholder - users can recalc via button */ }
  function toggleUASection(titleEl) {
    const section = titleEl.closest('.ua-section');
    if (section) {
      section.classList.toggle('collapsed');
    }
  }
  
  function getUAConfig() {
    return {
      minRate: parseFloat(document.getElementById('uaMinRate').value) || 0,
      entryRate: parseFloat(document.getElementById('uaEntryRate').value) || 100,
      mgmtFee: parseFloat(document.getElementById('uaMgmtFee').value) || 0,
      demoRateMode: document.getElementById('uaDemoRateMode').value,
      riskFeeType: document.getElementById('uaRiskFeeType').value,
      riskFeeRate: parseFloat(document.getElementById('uaRiskFeeRate').value) || 0,
      riskNetCalc: document.getElementById('uaRiskNetCalc').value
    };
  }

  function getUAInterestRates() {
    const rows = [];
    document.querySelectorAll('#uaIRBody tr').forEach(tr => {
      const inputs = tr.querySelectorAll('input');
      if (inputs.length >= 2) {
        const ym = inputs[0].value.trim();
        const rate = parseFloat(inputs[1].value);
        if (ym && !isNaN(rate)) rows.push({ yearMonth: ym, rate: rate });
      }
    });
    rows.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    return rows;
  }

  // ===== Fund Flow Table =====
  function getUAFundFlowData() {
    const rows = [];
    document.querySelectorAll('#uaFFBody tr').forEach(tr => {
      const inputs = tr.querySelectorAll('input');
      const selects = tr.querySelectorAll('select');
      if (inputs.length >= 2) {
        const date = inputs[0].value.trim();
        const flowType = (selects.length >= 1) ? selects[0].value : 'in';
        const amount = parseFloat(inputs[1].value) || 0;
        const feeRate = (inputs.length >= 3) ? (parseFloat(inputs[2].value) || 0) : 0;
        const returnType = (selects.length >= 2) ? selects[1].value : 'none';
        const returnN = (inputs.length >= 4) ? (parseInt(inputs[3].value) || 0) : 0;
        const returnDate = (inputs.length >= 5) ? inputs[4].value.trim() : '';
        if (date && amount > 0) rows.push({ date, flowType, amount, feeRate, returnType, returnN, returnDate });
      }
    });
    rows.sort((a, b) => a.date.localeCompare(b.date));
    return rows;
  }

  function isEditMode() {
    return !document.getElementById('company').disabled;
  }

  function addUAFundFlowRow(type, date, amount, feeRate, returnType, returnN) {
    const tbody = document.getElementById('uaFFBody');
    const tr = document.createElement('tr');
    const returnDate = date && returnType === 'afterN' && returnN > 0 && amount > 0 ? calcReturnDate(date, returnN) : (returnType === 'immediate' && date ? date : '-');
    tr.innerHTML = `
      <td><input type="date" value="${date || ''}" min="1900-01-01" max="2100-12-31" onchange="updateUAReturnDate(this.closest('tr'))"></td>
      <td>
        <select onchange="updateUAReturnDate(this.closest('tr'))">
          <option value="in" ${type === 'in' ? 'selected' : ''}>📥入</option>
          <option value="out" ${type === 'out' ? 'selected' : ''}>📤出</option>
        </select>
      </td>
      <td><input type="number" value="${amount || ''}" placeholder="0" min="0" step="0.01" onchange="updateUAReturnDate(this.closest('tr'))"></td>
      <td><input type="number" value="${feeRate !== undefined ? feeRate : '2'}" placeholder="0" min="0" max="100" step="0.01"></td>
      <td>
        <select onchange="updateUAReturnDate(this.closest('tr'))">
          <option value="none" ${returnType === 'none' ? 'selected' : ''}>不返还</option>
          <option value="afterN" ${returnType === 'afterN' ? 'selected' : ''}>满N年后返还</option>
          <option value="immediate" ${returnType === 'immediate' ? 'selected' : ''}>立即返还</option>
        </select>
      </td>
      <td><input type="number" value="${returnN || ''}" placeholder="N" min="1" onchange="updateUAReturnDate(this.closest('tr'))"></td>
      <td><input type="date" value="${returnDate !== '-' ? returnDate : ''}" min="1900-01-01" max="2100-12-31" style="font-size:11px;"></td>
      <td><button type="button" class="del-row-btn" onclick="this.closest('tr').remove()">×</button></td>
    `;
    tbody.appendChild(tr);
  }

  function calcReturnDate(date, years) {
    if (!date || !years) return '-';
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + parseInt(years));
    return d.toISOString().slice(0, 10);
  }

  function updateUAReturnDate(row) {
    const inputs = row.querySelectorAll('input');
    const selects = row.querySelectorAll('select');
    const date = (inputs.length >= 1) ? inputs[0].value.trim() : '';
    const returnType = (selects.length >= 2) ? selects[1].value : 'none';
    const returnN = (inputs.length >= 4) ? inputs[3].value : '';
    const amt = (inputs.length >= 2) ? inputs[1].value : '';
    const returnDateCell = row.querySelectorAll('td')[6];
    if (returnDateCell) {
      const returnDateInput = returnDateCell.querySelector('input');
      if (returnDateInput) {
        if (returnType === 'afterN' && date && returnN && amt && parseFloat(amt) > 0) {
          returnDateInput.value = calcReturnDate(date, returnN);
        } else if (returnType === 'immediate' && date && amt && parseFloat(amt) > 0) {
          returnDateInput.value = date;
        } else {
          returnDateInput.value = '';
        }
      }
    }
  }

  function getUARiskFeeTable() {
    const rows = [];
    document.querySelectorAll('#uaRiskFeeBody tr').forEach(tr => {
      const inputs = tr.querySelectorAll('input');
      if (inputs.length >= 3) {
        rows.push({ startAge: parseInt(inputs[0].value)||0, endAge: parseInt(inputs[1].value)||0, rate: parseFloat(inputs[2].value)||0 });
      }
    });
    rows.sort((a, b) => a.startAge - b.startAge);
    return rows;
  }

  function addUACoefficientRow() {
    const tbody = document.getElementById('uaCoefficientBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="number" value="" placeholder="0" min="0" max="120"></td>
      <td><input type="number" value="" placeholder="0" min="0" max="120"></td>
      <td><input type="number" value="" placeholder="100" min="0" max="200" step="0.1"></td>
      <td><button type="button" class="del-row-btn" onclick="this.closest('tr').remove()">×</button></td>
    `;
    tbody.appendChild(tr);
  }

  function getUACoefficientTable() {
    const rows = [];
    document.querySelectorAll('#uaCoefficientBody tr').forEach(tr => {
      const inputs = tr.querySelectorAll('input');
      if (inputs.length >= 3) {
        rows.push({ startAge: parseInt(inputs[0].value) || 0, endAge: parseInt(inputs[1].value) || 0, coefficient: parseFloat(inputs[2].value) || 0 });
      }
    });
    rows.sort((a, b) => a.startAge - b.startAge);
    return rows;
  }

  function getInterestRateForMonth(monthDate, interestRates) {
    const monthStr = monthDate.toISOString().slice(0, 7);
    let lastRate = null;
    for (const r of interestRates) {
      if (r.yearMonth <= monthStr) lastRate = r.rate;
      else break;
    }
    return lastRate !== null ? lastRate : (interestRates.length > 0 ? interestRates[0].rate : 3.5);
  }

  function calcUAAccount(interestRates, fundFlows, config, policy) {
    const startDate = new Date(policy.startDate);
    const sumAssured = parseFloat(policy.sumAssured) || 0;
    const insuredAge = parseInt(policy.insuredAge) || 0;
    const maturityDate = policy.maturityDate ? new Date(policy.maturityDate) : null;

    const demoRateMode = config.demoRateMode || 'settled';
    const minRate = config.minRate || 0;
    const entryRate = (config.entryRate || 100) / 100;
    const mgmtFeeMonthly = config.mgmtFee || 0;

    // Read risk fee table from config (works in both edit and view modes)
    const riskFeeTable = (config.riskFeeType === 'table') ? (config.riskFeeTable || []) : [];
    console.log('UA calc start. Rate:', config.riskFeeType, config.riskFeeRate, 'RiskTable:', riskFeeTable.length, 'FlowRows:', fundFlows.length);

    // Determine end date
    let endDate;
    if (maturityDate && !isNaN(maturityDate.getTime())) {
      endDate = new Date(maturityDate);
    } else {
      endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 100);
      // 终身保单：限制至被保人105岁
      if (insuredAge > 0) {
        const maxAgeDate = new Date(startDate);
        maxAgeDate.setFullYear(maxAgeDate.getFullYear() + (105 - insuredAge));
        if (maxAgeDate < endDate) endDate = maxAgeDate;
      }
    }

    const current = new Date(startDate);
    let accountValue = 0;
    let cumTotalIn = 0, cumTotalOut = 0, cumAddFee = 0, cumFeeReturn = 0, cumRiskFee = 0, cumMgmtFee = 0;
    let cumYearPremium = 0;
    let effectiveSum = sumAssured; // 有效保险金额（默认=基本保额，table模式时动态计算）

    const annualRows = [];
    const feeReturnQueue = [];
    let paymentCount = 0;

    // Use only user-entered fund flows (no auto-gen from basic info)
    const allFlows = fundFlows.map(f => ({ ...f }));
    // Sort all flows by date
    allFlows.sort((a, b) => a.date.localeCompare(b.date));
    
    while (current <= endDate) {
      const dateStr = current.toISOString().slice(0, 10);

      // Process fund flows for this day
      for (const f of allFlows) {
        if (f.date === dateStr) {
          const fee = f.amount * (f.feeRate / 100);
          if (f.flowType === 'in') {
            accountValue += (f.amount - fee);
            cumTotalIn += f.amount;
            cumAddFee += fee;
            if (f.isAuto) cumYearPremium += f.amount;
          } else { // out
            accountValue -= (f.amount + fee);
            cumTotalOut += f.amount;
            cumAddFee += fee;
          }
          // Fee return tracking
          if (f.returnType === 'afterN' && f.returnN > 0) {
            let triggerDateStr;
            if (f.returnDate) {
              triggerDateStr = f.returnDate;
            } else {
              const returnDate = new Date(f.date);
              returnDate.setFullYear(returnDate.getFullYear() + f.returnN);
              triggerDateStr = returnDate.toISOString().slice(0,10);
            }
            feeReturnQueue.push({ triggerDate: triggerDateStr, amount: fee });
          } else if (f.returnType === 'immediate') {
            cumFeeReturn += fee;
          }
        }
      }

      // Process fee returns
      for (let i = feeReturnQueue.length - 1; i >= 0; i--) {
        if (dateStr >= feeReturnQueue[i].triggerDate) {
          cumFeeReturn += feeReturnQueue[i].amount;
          accountValue += feeReturnQueue[i].amount;
          feeReturnQueue.splice(i, 1);
        }
      }

      // Risk management fee (daily)
      const ageAtDay = insuredAge + Math.floor((current - startDate) / (365.25 * 24 * 3600 * 1000));
      let riskNetAmount = 0;
      if (config.riskFeeType === 'sumAssured') {
        riskNetAmount = (config.riskNetCalc === 'basicSum') ? sumAssured : Math.max(0, sumAssured - accountValue);
        if (riskNetAmount > 0) {
          const dailyRiskFee = (riskNetAmount / 1000) * config.riskFeeRate / 365;
          accountValue -= dailyRiskFee;
          cumRiskFee += dailyRiskFee;
        }
      } else if (config.riskFeeType === 'table') {
        // 动态基本保额：累计所有资金流水净额
        let dynamicBasicSum = 0;
        for (const f of allFlows) {
          if (f.date <= dateStr) {
            const fee = parseFloat(f.amount || 0) * (parseFloat(f.feeRate || 0) / 100);
            if (f.flowType === 'in') dynamicBasicSum += parseFloat(f.amount);
            else dynamicBasicSum -= (parseFloat(f.amount) + fee);
          }
        }
        // 按到达年龄查给付系数
        const coeffRow = (config.coefficientTable || []).find(c => ageAtDay >= c.startAge && ageAtDay <= c.endAge);
        const coeff = coeffRow ? coeffRow.coefficient : 100;
        // 有效保险金额 = Max(账户价值, 基本保险金额 × 给付系数)
        effectiveSum = Math.max(accountValue, dynamicBasicSum * coeff / 100);
        // 风险保险金额（风险净额）
        riskNetAmount = (config.riskNetCalc === 'basicSum') ? effectiveSum : Math.max(0, effectiveSum - accountValue);
        const row = riskFeeTable.find(r => ageAtDay >= r.startAge && ageAtDay <= (r.endAge || 999));
        if (row && row.rate > 0 && riskNetAmount > 0) {
          const dailyRiskFee = (riskNetAmount / 1000) * row.rate / 365;
          accountValue -= dailyRiskFee;
          cumRiskFee += dailyRiskFee;
        }
      }

      // Management fee (daily)
      const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
      const dailyMgmtFee = mgmtFeeMonthly / daysInMonth;
      accountValue -= dailyMgmtFee;
      cumMgmtFee += dailyMgmtFee;

      if (accountValue < 0) accountValue = 0;

      // Daily interest
      let annualRate;
      if (demoRateMode === 'min') {
        annualRate = minRate;
      } else {
        annualRate = getInterestRateForMonth(current, interestRates);
      }
      accountValue += accountValue * (annualRate / 100 / 365);

      // Check if end of year
      if (current.getMonth() === startDate.getMonth() - 1 || (current.getMonth() === 11 && startDate.getMonth() === 0)) {
        const year = Math.ceil((current - startDate) / (365.25 * 24 * 3600 * 1000));
        if (year >= 1 && current.getDate() === new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()) {
          annualRows.push({
            year,
            insuredAgeAtYear: insuredAge + year - 1,
            effectiveSumAssured: Math.round(effectiveSum),
            accountValue: Math.round(accountValue),
            cumTotalIn: Math.round(cumTotalIn),
            cumTotalOut: Math.round(cumTotalOut),
            cumFee: Math.round(cumAddFee),
            cumFeeReturn: Math.round(cumFeeReturn),
            cumRiskFee: Math.round(cumRiskFee),
            cumMgmtFee: Math.round(cumMgmtFee),
            netValue: Math.round(accountValue + cumFeeReturn)
          });
        }
      }

      // Advance one day
      current.setDate(current.getDate() + 1);
    }

    console.log('UA Complete. AV:', Math.round(accountValue), 'RiskFeeTotal:', cumRiskFee.toFixed(2));
    return {
      annualRows,
      summary: { cumTotalIn, cumTotalOut, cumAddFee, cumFeeReturn, cumRiskFee, cumMgmtFee, finalAV: Math.round(accountValue) }
    };
  }
  function recalcUAAccount() {
    const policy = getCurrentFormPolicy();
    if (!policy || policy.designType !== '万能型') return;
    const config = getUAConfig();
    config.riskFeeTable = getUARiskFeeTable();
    config.coefficientTable = getUACoefficientTable();
    const interestRates = getUAInterestRates();
    let fundFlows = getUAFundFlowData();
    // 合并年金转入记录作为入账资金
    const transferRecords = getUATransferData();
    transferRecords.forEach(t => {
      if (t.amount > 0) {
        fundFlows.push({
          date: t.date,
          flowType: 'in',
          amount: t.amount,
          feeRate: t.feeRate,
          returnType: t.returnType,
          returnN: t.returnN,
          returnDate: t.returnDate,
          source: 'annuityTransfer'
        });
      }
    });
    // Re-sort after merging
    fundFlows.sort((a, b) => a.date.localeCompare(b.date));
    if (interestRates.length === 0) {
      alert('请至少输入一条结算利率数据');
      return;
    }
    if (fundFlows.length === 0) {
      alert('资金出入流水表为空，请先建立初始资金记录。\n点击「+ 新增资金记录」添加一笔初始资金入账。');
      return;
    }
    const result = calcUAAccount(interestRates, fundFlows, config, policy);
    _uaCache[policy.id] = result;
    renderUAResult(result);
    const div = document.getElementById('uaCalcResult');
    div.style.display = 'block';
    div.innerHTML = `<strong>✅ 计算完成</strong><br>共生成 ${result.annualRows.length} 个保单年度的账户价值数据。<br>最终年末账户价值: ¥${formatMoney(result.summary.finalAV)} | 累计入账: ¥${formatMoney(result.summary.cumTotalIn)} | 累计出账: ¥${formatMoney(result.summary.cumTotalOut)} | 累计手续费(净): ¥${formatMoney(result.summary.cumAddFee - result.summary.cumFeeReturn)}`;
  }

  function renderUAResult(result) {
    if (!result || result.annualRows.length === 0) return;
    document.getElementById('uaResultSection').style.display = 'block';
    document.getElementById('uaResultSection').classList.remove('collapsed');
    document.getElementById('uaResultBody').innerHTML = result.annualRows.map(r => `
      <tr>
        <td>${r.year}</td>
        <td>${r.insuredAgeAtYear || '-'}</td>
        <td>${showAmounts ? formatMoney(r.effectiveSumAssured) : '¥***'}</td>
        <td>${showAmounts ? formatMoney(r.accountValue) : '¥***'}</td>
        <td>${showAmounts ? formatMoney(r.cumTotalIn) : '¥***'}</td>
        <td>${showAmounts ? formatMoney(r.cumTotalOut) : '¥***'}</td>
        <td>${showAmounts ? formatMoney(r.cumFee) : '¥***'}</td>
        <td>${showAmounts ? formatMoney(r.cumFeeReturn) : '¥***'}</td>
        <td>${showAmounts ? formatMoney(r.cumRiskFee) : '¥***'}</td>
        <td>${showAmounts ? formatMoney(r.cumMgmtFee) : '¥***'}</td>
        <td>${showAmounts ? formatMoney(r.netValue) : '¥***'}</td>
      </tr>
    `).join('');
  }
  function syncUAToCashValues() {
    const policy = getCurrentFormPolicy();
    if (!policy) { alert('无法找到该保单数据，刷新页面后重试'); return; }
    const cached = _uaCache[policy.id];
    if (!cached || !cached.annualRows.length) {
      alert('请先重新计算账户价值');
      return;
    }
    policy.cashValues = cached.annualRows.map(r => ({
      year: r.year,
      cashValue: r.netValue,
      dividend: '',
      distributed: false,
      annuityAmount: '',
      otherIncome: '',
      // Universal account fund flow data for benefit display
      _uaCumTotalIn: r.cumTotalIn,
      _uaCumTotalOut: r.cumTotalOut,
      _uaCumFee: r.cumFee,
      _uaCumFeeReturn: r.cumFeeReturn,
      _uaAccountValue: r.accountValue
    }));
    policy.cashValueImported = true;
    saveData();
    setTempCashValues(policy.cashValues);
    updateCashValueTable();
    renderTable();
    document.getElementById('cashValueImported').checked = true;
    alert(`已将 ${policy.cashValues.length} 个年度的账户价值（生存总利益）同步到现金价值表。\n现在可以切换到「利益演示」页查看图表和IRR。`);
  }
  function addUAAdditionalRow() {
    const tbody = document.getElementById('uaAPBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="date" value="" min="1900-01-01" max="2100-12-31"></td>
      <td><input type="number" value="" placeholder="0" min="0" step="0.01"></td>
      <td><input type="number" value="2" placeholder="2" min="0" max="100" step="0.01"></td>
      <td>
        <select>
          <option value="none">不返还</option>
          <option value="afterN">满N年后返还</option>
          <option value="immediate">立即返还</option>
        </select>
      </td>
      <td><input type="number" value="" placeholder="N" min="1"></td>
      <td><button type="button" class="del-row-btn" onclick="this.closest('tr').remove()">×</button></td>
    `;
    tbody.appendChild(tr);
  }

  function addUAInterestRateRow() {
    const tbody = document.getElementById('uaIRBody');
    const tr = document.createElement('tr');
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    tr.innerHTML = `
      <td><input type="month" value="${monthStr}"></td>
      <td><input type="number" value="3.50" placeholder="3.50" min="0" max="20" step="0.01"></td>
      <td><button type="button" class="del-row-btn" onclick="this.closest('tr').remove()">×</button></td>
    `;
    tbody.appendChild(tr);
  }

  function addUARiskFeeRow() {
    const tbody = document.getElementById('uaRiskFeeBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="number" value="" placeholder="0" min="0" max="120"></td>
      <td><input type="number" value="" placeholder="0" min="0" max="120"></td>
      <td><input type="number" value="" placeholder="0.50" min="0" step="0.01"></td>
      <td><button type="button" class="del-row-btn" onclick="this.closest('tr').remove()">×</button></td>
    `;
    tbody.appendChild(tr);
  }

  function toggleUAReturnN() {
    const type = document.getElementById('uaAddFeeReturnType').value;
    document.getElementById('uaAddFeeReturnNGroup').style.display = (type === 'afterN') ? '' : 'none';
  }

  function toggleUARiskFee() {
    const type = document.getElementById('uaRiskFeeType').value;
    document.getElementById('uaRiskFeeRateGroup').style.display = (type === 'sumAssured') ? '' : 'none';
    document.getElementById('uaRiskNetGroup').style.display = (type === 'sumAssured' || type === 'table') ? '' : 'none';
    document.getElementById('uaRiskFeeTableContainer').style.display = (type === 'table') ? '' : 'none';
    document.getElementById('uaCoefficientSection').style.display = (type === 'table') ? '' : 'none';
  }
  // Extend switchTab to handle universalAccount tab
  const _originalSwitchTab = switchTab;
  switchTab = function(tab) {
    _originalSwitchTab(tab);
    // Toggle universalAccount tab visibility
    const tabEl = document.getElementById('tabUniversalAccount');
    if (tabEl) {
      if (!tabEl.classList.contains('active')) {
        document.getElementById('panelUniversalAccount').classList.remove('active');
      }
    }
    // Handle panelUniversalAccount
    if (tab === 'universalAccount') {
      document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t.id === 'tabUniversalAccount'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'panelUniversalAccount'));
      // Show/hide based on design type
      const policy = getCurrentFormPolicy();
      const isUniversal = document.getElementById('designType').value === '万能型';
      document.getElementById('uaNonUniversal').style.display = isUniversal ? 'none' : 'block';
      document.getElementById('uaContent').style.display = isUniversal ? 'block' : 'none';
      // Load cached result if available
      if (isUniversal && policy && _uaCache[policy.id]) {
        renderUAResult(_uaCache[policy.id]);
      }
      // Show edit mode prompt if not in edit mode
      if (isUniversal && policy && document.getElementById('company').disabled) {
        if (!document.getElementById('uaEditPrompt')) {
          const uaContent = document.getElementById('uaContent');
          const prompt = document.createElement('div');
          prompt.id = 'uaEditPrompt';
          prompt.style.cssText = 'background:#fef3c7;border:1px solid #fbbf24;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#92400e;';
          prompt.innerHTML = '💡 万能账户数据仅可在编辑状态下修改。请点击底部的「编辑」按钮进入编辑模式。';
          uaContent.insertBefore(prompt, uaContent.firstChild);
        }
      } else {
        const prompt = document.getElementById('uaEditPrompt');
        if (prompt) prompt.remove();
      }
    }
    // 利益演示tab：视图模式下隐藏编辑按钮
    const rightBtn = document.getElementById('modalBtnRight');
    const isViewMode = document.getElementById('modalTitle').textContent === '保单详情';
    if (tab === 'benefit' && isViewMode && rightBtn) {
      rightBtn.style.display = 'none';
    } else if (isViewMode && rightBtn) {
      rightBtn.style.display = '';
    }
  };
  // Extend toggleExtraFields to show/hide UA tab and auto-init
  const _originalToggleExtraFields = toggleExtraFields;
  toggleExtraFields = function() {
    _originalToggleExtraFields();
    const isUniversal = document.getElementById('designType').value === '万能型';
    const tab = document.getElementById('tabUniversalAccount');
    if (tab) {
      tab.style.display = isUniversal ? '' : 'none';
    }
    // 万能型隐藏现金价值tab和同步按钮；非万能型恢复
    const tabCV = document.getElementById('tabCashValue');
    if (tabCV) tabCV.style.display = isUniversal ? 'none' : '';
    const syncContainer = document.getElementById('uaSyncContainer');
    if (syncContainer) syncContainer.style.display = isUniversal ? 'none' : '';
    if (isUniversal) {
      const content = document.getElementById('uaContent');
      const nonUni = document.getElementById('uaNonUniversal');
      if (content) content.style.display = 'block';
      if (nonUni) nonUni.style.display = 'none';

      // Auto-generate initial fund flow ONLY when creating new policy (no policyId)
      const uaPolicyId = document.getElementById('policyId').value;
      const ffBody = document.getElementById('uaFFBody');
      if (!uaPolicyId && ffBody && ffBody.querySelectorAll('tr').length === 0) {
        const startDate = document.getElementById('startDate').value;
        const annualPremium = parseFloat(document.getElementById('annualPremium').value) || 0;
        const paymentTerm = parseInt(document.getElementById('paymentTerm').value) || 0;
        if (startDate && annualPremium > 0 && paymentTerm > 0) {
          const totalInitial = annualPremium * paymentTerm;
          // Add as a locked initial row
          const tr = document.createElement('tr');
          const returnDate = '';
          tr.innerHTML = `
            <td><input type="date" value="${startDate}" min="1900-01-01" max="2100-12-31" disabled title="初始资金日期（继承自投保日期）"></td>
            <td>
              <select disabled>
                <option value="in" selected>📥入</option>
              </select>
            </td>
            <td><input type="number" value="${totalInitial}" min="0" step="0.01" title="初始资金金额可修改"></td>
            <td><input type="number" value="5" placeholder="0" min="0" max="100" step="0.01"></td>
            <td>
              <select>
                <option value="none">不返还</option>
                <option value="afterN">满N年后返还</option>
                <option value="immediate">立即返还</option>
              </select>
            </td>
            <td><input type="number" value="" placeholder="N" min="1"></td>
            <td><input type="date" value="" min="1900-01-01" max="2100-12-31" style="font-size:11px;"></td>
            <td style="font-size:11px;color:#9ca3af;">初始</td>
          `;
          ffBody.appendChild(tr);
        }
      }
    }
  };
  // Disable all UA inputs for non-edit mode (covers dynamically created elements)
  function disableUAInputs() {
    document.querySelectorAll('#uaContent input, #uaContent select, #uaContent textarea').forEach(el => {
      el.disabled = true;
    });
    document.querySelectorAll('#uaContent .del-row-btn').forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.45';
    });
  }
  // Extend enableEditMode to handle UA
  const _originalEnableEditMode = enableEditMode;
  enableEditMode = function() {
    _originalEnableEditMode();
    const policy = getCurrentFormPolicy();
    if (policy && policy.designType === '万能型') {
      loadUADataToForm(policy);
    }
  };
  function clearUAForm() {
    ['uaIRBody', 'uaFFBody', 'uaRiskFeeBody', 'uaCoefficientBody', 'uaTransferBody'].forEach(function(id) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });
    const resultSec = document.getElementById('uaResultSection');
    if (resultSec) resultSec.style.display = 'none';
    const calcRes = document.getElementById('uaCalcResult');
    if (calcRes) calcRes.style.display = 'none';
    const prompt = document.getElementById('uaEditPrompt');
    if (prompt) prompt.remove();
  }
  function loadUADataToForm(policy) {
    const ua = policy.universalAccount || {};
    // Basic params
    document.getElementById('uaMinRate').value = ua.minRate !== undefined ? ua.minRate : '';
    document.getElementById('uaEntryRate').value = ua.entryRate !== undefined ? ua.entryRate : '';
    document.getElementById('uaMgmtFee').value = ua.mgmtFee !== undefined ? ua.mgmtFee : '';
    document.getElementById('uaDemoRateMode').value = ua.demoRateMode || 'settled';
    document.getElementById('uaWithdrawFeeRates').value = ua.withdrawFeeRates || '';
    document.getElementById('uaWithdrawFeeReturnType').value = ua.withdrawFeeReturnType || 'none';
    document.getElementById('uaRiskFeeType').value = ua.riskFeeType || 'none';
    document.getElementById('uaRiskFeeRate').value = ua.riskFeeRate || '';
    document.getElementById('uaRiskNetCalc').value = ua.riskNetCalc || 'basicSum';
    toggleUARiskFee();

    // Interest rates
    document.getElementById('uaIRBody').innerHTML = '';
    const irArr = ua.interestRates || [];
    irArr.forEach(ir => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="month" value="${ir.yearMonth || ''}"></td>
        <td><input type="number" value="${ir.rate !== undefined ? ir.rate : ''}" placeholder="3.50" min="0" max="20" step="0.01"></td>
        <td><button type="button" class="del-row-btn" onclick="this.closest('tr').remove()">×</button></td>
      `;
      document.getElementById('uaIRBody').appendChild(tr);
    });

    // Fund flow data
    document.getElementById('uaFFBody').innerHTML = '';
    const ffArr = ua.fundFlows || [];
    ffArr.forEach((f, idx) => {
      const isInitial = (idx === 0 && f.date === policy.startDate && f.flowType === 'in');
      addUAFundFlowRow(f.flowType, f.date, f.amount, f.feeRate, f.returnType, f.returnN);
      // Set the return date input if saved
      const rows = document.querySelectorAll('#uaFFBody tr');
      const lastRow = rows[rows.length - 1];
      if (lastRow && f.returnDate) {
        const rdi = lastRow.querySelectorAll('input[type="date"]');
        if (rdi.length >= 2) rdi[1].value = f.returnDate || '';
      }
      // Lock the initial row (date and type are read-only; amount is editable)
      if (isInitial) {
        const rds = lastRow.querySelectorAll('input');
        const sls = lastRow.querySelectorAll('select');
        if (rds.length >= 3) { rds[0].disabled = true; }
        if (sls.length >= 1) sls[0].disabled = true;
        lastRow.querySelectorAll('td')[7].innerHTML = '<span style="font-size:11px;color:#9ca3af;">初始</span>';
      }
    });

    // Risk fee table
    document.getElementById('uaRiskFeeBody').innerHTML = '';
    const rfArr = ua.riskFeeTable || [];
    rfArr.forEach(rf => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="number" value="${rf.startAge || ''}" placeholder="0" min="0" max="120"></td>
        <td><input type="number" value="${rf.endAge || ''}" placeholder="0" min="0" max="120"></td>
        <td><input type="number" value="${rf.rate || ''}" placeholder="0.50" min="0" step="0.01"></td>
        <td><button type="button" class="del-row-btn" onclick="this.closest('tr').remove()">×</button></td>
      `;
      document.getElementById('uaRiskFeeBody').appendChild(tr);
    });

    // Coefficient table
    document.getElementById('uaCoefficientBody').innerHTML = '';
    const coeffArr = ua.coefficientTable || [];
    coeffArr.forEach(cf => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="number" value="${cf.startAge || ''}" placeholder="0" min="0" max="120"></td>
        <td><input type="number" value="${cf.endAge || ''}" placeholder="0" min="0" max="120"></td>
        <td><input type="number" value="${cf.coefficient || ''}" placeholder="100" min="0" max="200" step="0.1"></td>
        <td><button type="button" class="del-row-btn" onclick="this.closest('tr').remove()">×</button></td>
      `;
      document.getElementById('uaCoefficientBody').appendChild(tr);
    });

    // Transfer records
    document.getElementById('uaTransferBody').innerHTML = '';
    document.getElementById('uaCanReceiveTransfer').checked = ua.canReceiveTransfer || false;
    updateUALinkedAnnuityPrompt(policy);
    const trArr = ua.transferRecords || [];
    trArr.forEach(t => {
      addUATransferRow(t);
    });
    document.getElementById('uaTransferSection').style.display = 'block';
    document.getElementById('uaTransferSection').classList.remove('collapsed');

    // Cached result
    if (_uaCache[policy.id]) {
      renderUAResult(_uaCache[policy.id]);
    } else {
      document.getElementById('uaResultSection').style.display = 'none';
      document.getElementById('uaCalcResult').style.display = 'none';
    }
    // Always ensure UA content is visible when loading data
    document.getElementById('uaNonUniversal').style.display = 'none';
    document.getElementById('uaContent').style.display = 'block';
  }

  // 反向查找关联的年金险，在万能险侧显示对方（年金险）名字。
  // 关联关系单向存储在年金险的 linkedUAPolicyId，故用万能险自身 id 反查"谁关联了我"。
  function updateUALinkedAnnuityPrompt(policy) {
    const prompt = document.getElementById('uaLinkedAnnuityPrompt');
    if (!prompt) return;
    if (!policy) { prompt.style.display = 'none'; return; }
    const linkedAnnuities = (policies || []).filter(p => p.linkedUAPolicyId === policy.id);
    if (linkedAnnuities.length > 0) {
      prompt.style.display = 'inline';
      prompt.textContent = '✅ 已关联年金险：' + linkedAnnuities.map(p => p.productName || '').join('、');
    } else {
      prompt.style.display = 'none';
    }
  }

  function onUACanReceiveTransferChange() {
    const policy = getCurrentFormPolicy ? getCurrentFormPolicy() : (currentPolicy || null);
    updateUALinkedAnnuityPrompt(policy);
  }

  // Extend savePolicy to save UA data
  const _originalSavePolicy = savePolicy;
  savePolicy = function() {
    const designType = document.getElementById('designType').value;
    // Before calling original save, ensure initial flow row exists and is synced
    if (designType === '万能型') {
      const ffBody = document.getElementById('uaFFBody');
      const startDate = document.getElementById('startDate').value;
      const annualPrem = parseFloat(document.getElementById('annualPremium').value) || 0;
      const payTerm = parseInt(document.getElementById('paymentTerm').value) || 0;
      const totalInitial = annualPrem * payTerm;
      if (ffBody) {
        const rows = ffBody.querySelectorAll('tr');
        if (rows.length === 0 || totalInitial <= 0) {
          // No rows at all - create initial row
          ffBody.innerHTML = '';
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><input type="date" value="${startDate}" min="1900-01-01" max="2100-12-31" disabled></td>
            <td><select disabled><option value="in" selected>📥入</option></select></td>
            <td><input type="number" value="${totalInitial}" min="0" step="0.01"></td>
            <td><input type="number" value="5" placeholder="0" min="0" max="100" step="0.01"></td>
            <td><select><option value="none">不返还</option><option value="afterN">满N年后返还</option><option value="immediate">立即返还</option></select></td>
            <td><input type="number" value="" placeholder="N" min="1"></td>
            <td><input type="date" value="" min="1900-01-01" max="2100-12-31" style="font-size:11px;"></td>
            <td style="font-size:11px;color:#9ca3af;">初始</td>
          `;
          ffBody.appendChild(tr);
        } else {
          const firstRow = rows[0];
          const lastCell = firstRow.querySelectorAll('td');
          if (lastCell.length >= 7 && lastCell[7].textContent.trim() === '初始') {
            const rds = firstRow.querySelectorAll('input');
            if (rds.length >= 3) {
              if (startDate) rds[0].value = startDate;
            }
          }
        }
      }
    }
    // Build UA data object and save to dataset for use after original save
    if (designType === '万能型') {
      const ua = {
        minRate: document.getElementById('uaMinRate').value,
        entryRate: document.getElementById('uaEntryRate').value,
        mgmtFee: document.getElementById('uaMgmtFee').value,
        demoRateMode: document.getElementById('uaDemoRateMode').value,
        withdrawFeeRates: document.getElementById('uaWithdrawFeeRates').value,
        withdrawFeeReturnType: document.getElementById('uaWithdrawFeeReturnType').value,
        riskFeeType: document.getElementById('uaRiskFeeType').value,
        riskFeeRate: document.getElementById('uaRiskFeeRate').value,
        riskNetCalc: document.getElementById('uaRiskNetCalc').value,
        interestRates: [],
        fundFlows: [],
        riskFeeTable: [],
        coefficientTable: [],
        canReceiveTransfer: document.getElementById('uaCanReceiveTransfer').checked,
        transferRecords: []
      };
      // Interest rates
      document.querySelectorAll('#uaIRBody tr').forEach(tr => {
        const inputs = tr.querySelectorAll('input');
        ua.interestRates.push({ yearMonth: inputs[0].value, rate: inputs[1].value });
      });
      // Fund flows
      document.querySelectorAll('#uaFFBody tr').forEach(tr => {
        const inputs = tr.querySelectorAll('input');
        const selects = tr.querySelectorAll('select');
        if (inputs.length >= 2 && inputs[0].value.trim()) {
          ua.fundFlows.push({
            date: inputs[0].value,
            amount: inputs[1].value,
            flowType: (selects.length >= 1) ? selects[0].value : 'in',
            feeRate: (inputs.length >= 3) ? (inputs[2].value || '') : '',
            returnType: (selects.length >= 2) ? selects[1].value : 'none',
            returnN: (inputs.length >= 4) ? (inputs[3].value || '') : '',
            returnDate: (inputs.length >= 5) ? (inputs[4].value || '') : ''
          });
        }
      });
      // Risk fee table
      document.querySelectorAll('#uaRiskFeeBody tr').forEach(tr => {
        const inputs = tr.querySelectorAll('input');
        ua.riskFeeTable.push({ startAge: inputs[0].value, endAge: inputs[1].value, rate: inputs[2].value });
      });
      // Coefficient table
      document.querySelectorAll('#uaCoefficientBody tr').forEach(tr => {
        const inputs = tr.querySelectorAll('input');
        ua.coefficientTable.push({ startAge: inputs[0].value, endAge: inputs[1].value, coefficient: inputs[2].value });
      });
      // Transfer records
      ua.transferRecords = getUATransferData();
      // Save UA data to dataset for use after original save
      document.getElementById('policyForm').dataset.uaData = JSON.stringify(ua);
      // Clear cache so next open recalculates
      const id = document.getElementById('policyId').value;
      if (id) delete _uaCache[id];
    }
    // Before original save: record current IDs to find newly added policy
    const prevIds = new Set(policies.map(p => p.id));
    const originalRet = _originalSavePolicy();
    // After original save: attach UA data to the saved policy, re-persist, and refresh UA display
    if (designType === '万能型') {
      let id = document.getElementById('policyId').value;
      if (!id) {
        // New policy: find the policy whose ID wasn't in prevIds
        const newPolicy = policies.find(p => !prevIds.has(p.id));
        if (newPolicy) id = newPolicy.id;
      }
      const uaData = JSON.parse(document.getElementById('policyForm').dataset.uaData || '{}');
      const policy = policies.find(p => p.id === id);
      if (policy) {
        policy.universalAccount = uaData;
        saveData(); // Persist with UA data
        // Reload UA data into form (disableEditMode already ran without UA data, so UI is blank)
        loadUADataToForm(policy);
        disableUAInputs();
        // Recalculate and show UA result (cache was cleared, so switchTab won't find it)
        recalcUAAccount();
      }
    }
    return originalRet;
  };
  // Extend disableEditMode to load UA
  const _originalDisableEditMode = disableEditMode;
  disableEditMode = function() {
    _originalDisableEditMode();
    const policy = getCurrentFormPolicy();
    if (policy && policy.designType === '万能型') {
      loadUADataToForm(policy);
      disableUAInputs();
      document.getElementById('uaNonUniversal').style.display = 'none';
      document.getElementById('uaContent').style.display = 'block';
    }
  };
  // Add designType change listener
  document.getElementById('designType').addEventListener('change', function() {
    toggleExtraFields();
    const isUniversal = this.value === '万能型';
    if (isUniversal) {
      // Ensure UA tab is shown
      document.getElementById('uaNonUniversal').style.display = 'none';
      document.getElementById('uaContent').style.display = 'block';
    }
  });

  init();
