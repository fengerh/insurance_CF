  function setFormEnabled(enabled) {
    const form = document.getElementById('policyForm');
    const elements = form.querySelectorAll('input, select, textarea');
    elements.forEach(el => {
      if (el.id === 'policyId' || el.id === 'benefitDemoMode') return;
      el.disabled = !enabled;
      if (!enabled) {
        // 详情模式：设置 title 为当前值，鼠标悬停显示完整内容
        el.title = el.value || '';
      } else {
        // 编辑/新增模式：清除 title
        el.removeAttribute('title');
      }
    });
    // Control UA action buttons
    const uaBtns = ['+ 新增资金记录', '+ 添加转入记录', '+ 新增月份', '+ 添加年龄段', '🔄 重新计算账户价值', '📥 同步到现金价值表'];
    document.querySelectorAll('#uaContent .btn').forEach(btn => {
      const text = btn.textContent.trim();
      if (uaBtns.some(t => text.startsWith(t))) {
        btn.disabled = !enabled;
        btn.style.opacity = enabled ? '1' : '0.45';
      }
    });
    // Control cash value action buttons
    const cvBtns = document.querySelectorAll('#addCashValueRowBtn, #clearAllCashValuesBtn');
    cvBtns.forEach(btn => {
      btn.disabled = !enabled;
      btn.style.opacity = enabled ? '1' : '0.45';
    });
    // 转入万能批量按钮与"添加一行"同步可用状态（详情/只读模式下一并禁用）
    document.querySelectorAll('#transferBatchOps button').forEach(btn => {
      btn.disabled = !enabled;
      btn.style.opacity = enabled ? '1' : '0.45';
    });
  }

  function openAddModal() {
    switchTab('basicInfo');
    document.getElementById('modalTitle').textContent = '新增保单';
    document.getElementById('policyForm').reset();
    if (typeof clearUAForm === 'function') clearUAForm();
    document.getElementById('maturityAmount').value = '';
    document.getElementById('maturityDate').value = '';
    document.getElementById('annualPayout').value = '';
    document.getElementById('isMonthlyPayout').checked = false;
    document.getElementById('monthlyPayout').value = '';
    document.getElementById('insuredAge').value = '';
    toggleMonthlyPayout();
    document.getElementById('policyId').value = '';
    document.getElementById('channel').value = '';
    document.getElementById('coverageType').value = '终身';
    document.getElementById('annuityStartType').value = 'anniversary';
    document.getElementById('annuityStartValue').value = '';
    document.getElementById('annuityStartDate').value = '';
    document.getElementById('isSurrendered').checked = false;
    document.getElementById('surrenderDate').value = '';
    document.getElementById('surrenderAmount').value = '';
    document.getElementById('hasOtherIncome').checked = false;
    document.getElementById('excludedFromSummary').checked = false;
    document.getElementById('transferToUA').checked = false;
    document.getElementById('linkedUAPolicy').value = '';
    document.getElementById('linkedUAPolicy').style.display = 'none';
    document.getElementById('linkedUAPrompt').style.display = 'none';
    toggleSurrenderFields();

    updateAnnuityStartLabel();
    toggleCoverageInput();
    updateAutoCalc();
    setFormEnabled(true);

    const category = document.getElementById('productCategory').value;
    if (category === '年金保险') {
      document.getElementById('annuityStartType').value = 'anniversary';
    } else if (category === '养老年金保险') {
      document.getElementById('annuityStartType').value = 'age';
    }
    updateAnnuityStartLabel();
    autoCalcAnnuityStartDate();

    const leftBtn = document.getElementById('modalBtnLeft');
    const rightBtn = document.getElementById('modalBtnRight');
    rightBtn.textContent = '保存';
    rightBtn.onclick = savePolicy;
    leftBtn.textContent = '取消';
    leftBtn.onclick = closeModal;

    document.getElementById('formModal').classList.add('active');
  }
  function openDetailModal(id) {
    const policy = policies.find(p => p.id === id);
    if (!policy) { alert('无法找到该保单数据，刷新页面后重试'); return; }

    switchTab('basicInfo');
    document.getElementById('policyId').value = policy.id;
    document.getElementById('company').value = policy.company || '';
    document.getElementById('productName').value = policy.productName || '';
    document.getElementById('productCategory').value = policy.productCategory || '';
    document.getElementById('designType').value = policy.designType || '';
    document.getElementById('channel').value = policy.channel || '';
    document.getElementById('policyHolder').value = policy.policyHolder || '';
    document.getElementById('insured').value = policy.insured || '';
    document.getElementById('startDate').value = policy.startDate || '';
    document.getElementById('annualPremium').value = policy.annualPremium || '';
    document.getElementById('paymentTerm').value = policy.paymentTerm || '';
    document.getElementById('coverageType').value = policy.coverageType || '终身';
    document.getElementById('coverageValue').value = policy.coverageValue || '';
    document.getElementById('sumAssured').value = policy.sumAssured || '';
    document.getElementById('insuredAge').value = policy.insuredAge || '';
    document.getElementById('maturityAmount').value = policy.maturityAmount || '';
    document.getElementById('maturityDate').value = policy.maturityDate || '';
    document.getElementById('annualPayout').value = policy.annualPayout || '';
    document.getElementById('isMonthlyPayout').checked = policy.isMonthlyPayout || false;
    document.getElementById('monthlyPayout').value = policy.monthlyPayout || '';
    toggleMonthlyPayout();
    document.getElementById('remarks').value = policy.remarks || '';
    document.getElementById('annuityStartType').value = policy.annuityStartType || 'anniversary';
    document.getElementById('annuityStartValue').value = policy.annuityStartValue || '';
    document.getElementById('annuityStartDate').value = policy.annuityStartDate || '';
    document.getElementById('isSurrendered').checked = policy.isSurrendered || false;
    document.getElementById('surrenderDate').value = policy.surrenderDate || '';
    document.getElementById('surrenderAmount').value = policy.surrenderAmount || '';
    document.getElementById('manualAnnuity').checked = policy.manualAnnuity || false;
    document.getElementById('transferToUA').checked = policy.transferToUA || false;
    document.getElementById('linkedUAPolicy').value = policy.linkedUAPolicyId || '';
    document.getElementById('linkedUAPolicy').style.display = policy.transferToUA ? 'inline-block' : 'none';
    document.getElementById('linkedUAPrompt').style.display = 'none';
    if (policy.transferToUA) {
      populateLinkedUAPolicies(policy.linkedUAPolicyId);
      if (policy.linkedUAPolicyId) {
        document.getElementById('linkedUAPrompt').style.display = 'inline';
        document.getElementById('linkedUAPrompt').textContent = '✅ 已关联万能险：' + (policies.find(p => p.id === policy.linkedUAPolicyId)?.productName || '');
      }
    }
    document.getElementById('hasOtherIncome').checked = policy.hasOtherIncome || false;
    document.getElementById('excludedFromSummary').checked = policy.excludedFromSummary || false;
    toggleSurrenderFields();
    updateAnnuityStartLabel();
    toggleCoverageInput();
    updateAutoCalc();
    // 初始化现金价值数据
    if (!policy.cashValues) policy.cashValues = [];
    setTempCashValues(policy.cashValues);
    document.getElementById('cashValueImported').checked = policy.cashValueImported || false;
    updateCashValueTable();

    // 万能型：加载UA数据（try/catch保护，确保不会阻断模态框显示）
    if (policy.designType === '万能型') {
      try {
        loadUADataToForm(policy);
        disableUAInputs();
        document.getElementById('uaNonUniversal').style.display = 'none';
        document.getElementById('uaContent').style.display = 'block';
      } catch(e) {
        console.warn('加载万能账户数据时出错:', e);
      }
    }

    setFormEnabled(false);
    document.getElementById('modalTitle').textContent = '保单详情';
    updateCashValueTable();

    const leftBtn = document.getElementById('modalBtnLeft');
    const rightBtn = document.getElementById('modalBtnRight');
    rightBtn.textContent = '编辑';
    rightBtn.onclick = enableEditMode;
    leftBtn.textContent = '关闭';
    leftBtn.onclick = closeModal;

    document.getElementById('formModal').classList.add('active');
  }
  function updateAnnuityStartLabel() {
    const type = document.getElementById('annuityStartType').value;
    const label = document.getElementById('annuityStartLabel');
    if (type === 'anniversary') {
      label.textContent = '第几个周年日';
    } else {
      label.textContent = '到达年龄（岁）';
    }
  }

  function autoCalcAnnuityStartDate() {
    const startDate = document.getElementById('startDate').value;
    const startType = document.getElementById('annuityStartType').value;
    const startValue = document.getElementById('annuityStartValue').value;
    const insuredAge = document.getElementById('insuredAge').value;
    const resultInput = document.getElementById('annuityStartDate');

    if (!startDate || !startValue) {
      resultInput.value = '';
      return;
    }

    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      resultInput.value = '';
      return;
    }

    let yearsToAdd = 0;
    if (startType === 'anniversary') {
      const n = parseInt(startValue);
      if (isNaN(n) || n <= 0) {
        resultInput.value = '';
        return;
      }
      yearsToAdd = n;
    } else if (startType === 'age') {
      const targetAge = parseInt(startValue);
      const age = parseInt(insuredAge);
      if (isNaN(targetAge) || targetAge <= 0 || isNaN(age) || age <= 0) {
        resultInput.value = '';
        return;
      }
      yearsToAdd = targetAge - age;
      if (yearsToAdd < 0) {
        resultInput.value = '';
        return;
      }
    } else {
      resultInput.value = '';
      return;
    }

    const result = new Date(start);
    result.setFullYear(result.getFullYear() + yearsToAdd);
    resultInput.value = result.toISOString().slice(0, 10);
  }
  function autoCalcMaturityDate() {
    const startDate = document.getElementById('startDate').value;
    const coverageType = document.getElementById('coverageType').value;
    const coverageValue = document.getElementById('coverageValue').value;
    const insuredAge = document.getElementById('insuredAge').value;
    const maturityDateInput = document.getElementById('maturityDate');

    if (!startDate) {
      maturityDateInput.value = '';
      return;
    }

    let maturityDate = '';
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      maturityDateInput.value = '';
      return;
    }

    if (coverageType === '固定年限') {
      const years = parseInt(coverageValue);
      if (!isNaN(years) && years > 0) {
        const end = new Date(start);
        end.setFullYear(end.getFullYear() + years);
        maturityDate = end.toISOString().slice(0, 10);
      }
    } else if (coverageType === '保至年龄') {
      const targetAge = parseInt(coverageValue);
      const age = parseInt(insuredAge);
      if (!isNaN(targetAge) && targetAge > 0 && !isNaN(age) && age > 0) {
        const yearsToAdd = targetAge - age;
        if (yearsToAdd >= 0) {
          const end = new Date(start);
          end.setFullYear(end.getFullYear() + yearsToAdd);
          maturityDate = end.toISOString().slice(0, 10);
        }
      }
    } else {
      maturityDateInput.value = '';
      return;
    }

    if (maturityDate) {
      maturityDateInput.value = maturityDate;
    } else {
      maturityDateInput.value = '';
    }
  }

  function enableEditMode() {
    setFormEnabled(true);
    document.getElementById('modalTitle').textContent = '编辑保单';

    const leftBtn = document.getElementById('modalBtnLeft');
    const rightBtn = document.getElementById('modalBtnRight');
    leftBtn.textContent = '取消';
    leftBtn.onclick = disableEditMode;
    rightBtn.textContent = '保存';
    rightBtn.onclick = savePolicy;

    updateCashValueTable();
  }

  function toggleExtraFields() {
    const category = document.getElementById('productCategory').value;
    const coverageType = document.getElementById('coverageType').value;
    
    const maturityFields = document.getElementById('maturityFields');
    if (maturityFields) {
      if (coverageType !== '终身') {
        maturityFields.style.display = 'flex';
      } else {
        maturityFields.style.display = 'none';
      }
    }

    const annuityFields = document.getElementById('annuityFields');
    if (annuityFields) {
      if (category === '年金保险' || category === '养老年金保险') {
        annuityFields.style.display = 'flex';
        if (!document.getElementById('policyId').value) {
          if (category === '年金保险') {
            document.getElementById('annuityStartType').value = 'anniversary';
          } else if (category === '养老年金保险') {
            document.getElementById('annuityStartType').value = 'age';
          }
          updateAnnuityStartLabel();
          autoCalcAnnuityStartDate();
        }
      } else {
        annuityFields.style.display = 'none';
      }
    }
    // 转入万能行：仅年金/养老年金产品显示
    const transferRow = document.getElementById('transferToUARow');
    if (transferRow) {
      transferRow.style.display = (category === '年金保险' || category === '养老年金保险') ? '' : 'none';
    }
  }

  function toggleMonthlyPayout() {
    const isChecked = document.getElementById('isMonthlyPayout').checked;
    const group = document.getElementById('monthlyPayoutGroup');
    if (group) {
      group.style.display = isChecked ? 'block' : 'none';
    }
  }

  function getFormCashValues() {
    const policy = getCurrentFormPolicy();
    if (policy && policy.cashValues) {
      let cv = policy.cashValues;
      if (typeof cv === 'string') { try { cv = JSON.parse(cv); } catch(e) { cv = []; } }
      return Array.isArray(cv) ? cv : [];
    }
    return getTempCashValues();
  }

  function toggleSurrenderFields() {
    const isChecked = document.getElementById('isSurrendered').checked;
    const display = isChecked ? 'block' : 'none';
    const dateGroup = document.getElementById('surrenderDateGroup');
    const amountGroup = document.getElementById('surrenderAmountGroup');
    if (dateGroup) dateGroup.style.display = display;
    if (amountGroup) amountGroup.style.display = display;
    if (!isChecked) {
      document.getElementById('surrenderDate').value = '';
      document.getElementById('surrenderAmount').value = '';
    }
  }
  // ===== 年金⇄万能转入关联功能 =====
  function onTransferToUAChange() {
    const checked = document.getElementById('transferToUA').checked;
    const linkedSel = document.getElementById('linkedUAPolicy');
    const prompt = document.getElementById('linkedUAPrompt');

    linkedSel.style.display = checked ? 'inline-block' : 'none';
    prompt.style.display = 'none';

    if (checked) {
      if (!document.getElementById('manualAnnuity').checked) {
        prompt.style.display = 'inline';
        prompt.textContent = '⚠️ 请先勾选「手动输入年金」';
      }
      populateLinkedUAPolicies();
    }
    updateCashValueTable();
  }

  function populateLinkedUAPolicies(linkedId) {
    const sel = document.getElementById('linkedUAPolicy');
    // 优先用保单数据里的"当前已关联 id"，避免依赖易失的 DOM .value（选项未生成时 .value 会返回空）
    const currentVal = (linkedId != null && linkedId !== '') ? linkedId : sel.value;
    const curId = document.getElementById('policyId').value;
    sel.innerHTML = '<option value="">-- 请选择关联的万能险保单 --</option>';
    // 显示所有已开启"可被转入"的万能险，加上当前已关联的（无论是否开启）
    const linkedIds = new Set();
    if (currentVal) linkedIds.add(currentVal);
    policies.filter(p =>
      p.designType === '万能型' &&
      p.id !== curId &&
      (p.universalAccount?.canReceiveTransfer || linkedIds.has(p.id))
    ).forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = (p.company || '') + ' ' + (p.productName || '');
      sel.appendChild(opt);
    });
    if (currentVal && [...sel.options].some(o => o.value === currentVal)) {
      sel.value = currentVal;
    }
  }

  function onLinkedUAPolicyChange() {
    const sel = document.getElementById('linkedUAPolicy');
    const prompt = document.getElementById('linkedUAPrompt');
    if (sel.value) {
      prompt.style.display = 'inline';
      prompt.textContent = '✅ 关联成功，年金转入将在保存时同步到万能账户';
    } else {
      prompt.style.display = 'none';
    }
    updateCashValueTable();
  }

  function batchSetTransfer(value) {
    const policy = getCurrentFormPolicy();
    const cashValues = policy && policy.cashValues ? policy.cashValues : [];
    cashValues.forEach(cv => {
      const amt = parseFloat(cv.annuityAmount) || 0;
      if (amt > 0) cv.transferToUA = value ? true : false;
    });
    updateCashValueTable();
  }
  function addUATransferRow(data) {
    const tbody = document.getElementById('uaTransferBody');
    const tr = document.createElement('tr');
    const d = data || {};
    tr.innerHTML = `
      <td><input type="date" value="${d.date || ''}" min="1900-01-01" max="2100-12-31" onchange="handleUAFieldChange()"></td>
      <td style="font-size:12px;">${d.sourcePolicyName || ''}<input type="hidden" class="uaTransferSourceId" value="${d.sourcePolicyId || ''}"></td>
      <td><input type="number" value="${d.amount || ''}" placeholder="0" min="0" step="0.01" style="background:#f3f4f6;color:#6b7280;" readonly title="转入金额继承自年金险，不可修改"></td>
      <td><input type="number" value="${d.feeRate !== undefined ? d.feeRate : '0'}" placeholder="0" min="0" max="100" step="0.01" onchange="handleUAFieldChange()"></td>
      <td>
        <select onchange="updateUAReturnDate(this.closest('tr'));handleUAFieldChange()">
          <option value="none"${d.returnType === 'none'?' selected':''}>不返还</option>
          <option value="afterN"${d.returnType === 'afterN'?' selected':''}>满N年后返还</option>
          <option value="immediate"${d.returnType === 'immediate'?' selected':''}>立即返还</option>
        </select>
      </td>
      <td><input type="number" value="${d.returnN || ''}" placeholder="N" min="1" onchange="updateUAReturnDate(this.closest('tr'));handleUAFieldChange()"></td>
      <td><input type="date" value="${d.returnDate || ''}" min="1900-01-01" max="2100-12-31" style="font-size:11px;" onchange="handleUAFieldChange()"></td>
      <td><button type="button" class="del-row-btn" onclick="this.closest('tr').remove();updateUACounts();handleUAFieldChange()">×</button></td>
    `;
    tbody.appendChild(tr);
    updateUACounts();
    // 添加记录后确保区块可见并展开，避免折叠状态下看不到新行
    const sec = document.getElementById('uaTransferSection');
    sec.style.display = 'block';
    sec.classList.remove('collapsed');
    handleUAFieldChange(); // 新增年金转入记录后自动重算
  }

  function getUATransferData() {
    const rows = [];
    document.querySelectorAll('#uaTransferBody tr').forEach(tr => {
      const inputs = tr.querySelectorAll('input');
      const selects = tr.querySelectorAll('select');
      if (inputs.length >= 2 && inputs[0].value.trim()) {
        const sourceIdInput = tr.querySelector('.uaTransferSourceId');
        rows.push({
          date: inputs[0].value,
          sourcePolicyId: sourceIdInput ? sourceIdInput.value : '',
          sourcePolicyName: tr.querySelectorAll('td')[1] ? tr.querySelectorAll('td')[1].textContent.trim() : '',
          amount: inputs[2] ? (parseFloat(inputs[2].value) || 0) : 0,
          feeRate: inputs.length >= 4 ? (parseFloat(inputs[3].value) || 0) : 0,
          returnType: selects.length >= 1 ? selects[0].value : 'none',
          returnN: inputs.length >= 5 ? (parseInt(inputs[4].value) || 0) : 0,
          returnDate: inputs.length >= 6 ? inputs[5].value.trim() : ''
        });
      }
    });
    return rows;
  }

  function getLinkedUAPolicy() {
    const id = document.getElementById('linkedUAPolicy').value;
    if (!id) return null;
    return policies.find(p => p.id === id) || null;
  }
  // ===== 选项卡切换 =====
  function switchTab(tab) {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t.id === 'tabBasicInfo' && tab === 'basicInfo' || t.id === 'tabCashValue' && tab === 'cashValue' || t.id === 'tabBenefit' && tab === 'benefit'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === (tab === 'basicInfo' ? 'panelBasicInfo' : tab === 'cashValue' ? 'panelCashValue' : 'panelBenefit')));
    if (tab === 'cashValue') updateCashValueTable();
    if (tab === 'benefit') renderBenefitDemo();
  }

  function updateCashValueImported() {
    const policy = getCurrentFormPolicy();
    if (policy) {
      policy.cashValueImported = document.getElementById('cashValueImported').checked;
      saveData();
    }
  }
  // ===== 利益演示 =====
  let benefitSelectedYear = null;       // 单保单选中年度
  let _comboSelectedYear = null;         // 组合选中年度
  let _comboRows = null;                 // 组合合并后的利益行
  let _comboPolicyList = null;           // 组合包含的两张保单

  function getBenefitDemoMode() {
    const sel = document.getElementById('benefitDemoMode');
    return sel ? sel.value : 'total';
  }

  function getBenefitValue(r, mode) {
    if (mode === undefined) mode = getBenefitDemoMode();
    return mode === 'totalWithOther' ? (r.totalBenefitWithOther || r.totalBenefit) : r.totalBenefit;
  }

  function getBenefitLabel(mode) {
    if (mode === undefined) mode = getBenefitDemoMode();
    return mode === 'totalWithOther' ? '总利益（含）' : '保单总利益';
  }

  // 万能账户计算结果（带缓存），供单保单与组合 IRR 共用
  function getUAResult(policy) {
    if (!policy || !policy.universalAccount) return null;
    let uaResult = _uaCache[policy.id];
    if (!uaResult || !uaResult.annualRows || uaResult.annualRows.length === 0) {
      const ua = policy.universalAccount;
      const config = {
        minRate: parseFloat(ua.minRate) || 0,
        entryRate: parseFloat(ua.entryRate) || 100,
        mgmtFee: parseFloat(ua.mgmtFee) || 0,
        demoRateMode: ua.demoRateMode || 'settled',
        riskFeeType: ua.riskFeeType || 'none',
        riskFeeRate: parseFloat(ua.riskFeeRate) || 0,
        riskNetCalc: ua.riskNetCalc || 'basicSum',
        riskFeeTable: ua.riskFeeTable || []
      };
      const interestRates = (ua.interestRates || []).map(ir => ({ yearMonth: ir.yearMonth, rate: parseFloat(ir.rate) || 0 }));
      const fundFlows = (ua.fundFlows || []).map(f => ({
        date: f.date,
        flowType: f.flowType,
        amount: parseFloat(f.amount) || 0,
        feeRate: parseFloat(f.feeRate) || 0,
        returnType: f.returnType,
        returnN: parseInt(f.returnN) || 0,
        returnDate: f.returnDate || ''
      }));
      // 合并年金转入记录
      const transferRecords = ua.transferRecords || [];
      transferRecords.forEach(t => {
        if (parseFloat(t.amount) > 0) {
          fundFlows.push({
            date: t.date,
            flowType: 'in',
            amount: parseFloat(t.amount) || 0,
            feeRate: parseFloat(t.feeRate) || 0,
            returnType: t.returnType || 'none',
            returnN: parseInt(t.returnN) || 0,
            returnDate: t.returnDate || '',
            source: 'annuityTransfer'
          });
        }
      });
      fundFlows.sort((a, b) => a.date.localeCompare(b.date));
      uaResult = calcUAAccount(interestRates, fundFlows, config, policy);
      _uaCache[policy.id] = uaResult;
    }
    return uaResult;
  }

  // 计算单个保单的利益分量行（按持有年度对齐）
  function computeSinglePolicyRows(policy, opts) {
    if (!policy) return null;
    // 万能型产品：使用万能账户计算引擎结果
    if (policy.designType === '万能型' && policy.universalAccount && policy.universalAccount.fundFlows && policy.universalAccount.fundFlows.length > 0) {
      const uaResult = getUAResult(policy);
      if (uaResult && uaResult.annualRows && uaResult.annualRows.length > 0) {
        const ia = parseInt(policy.insuredAge) || 0;
        return uaResult.annualRows.map(r => ({
          year: r.year,
          insuredAgeAtYear: ia > 0 ? ia + r.year - 1 : 0,
          cashValue: r.accountValue,
          cumDividend: 0,
          cumAnnuity: 0,
          maturityAmt: 0,
          cumPremium: (opts && opts.excludeTransferPremium) ? r.cumActiveIn : r.cumTotalIn,
          totalBenefit: r.netValue,
          cumOtherIncome: 0,
          totalBenefitWithOther: r.netValue
        }));
      }
    }
    const cashValues = policy.cashValues || [];
    if (cashValues.length === 0) return null;
    const sorted = [...cashValues].sort((a, b) => (parseInt(a.year) || 0) - (parseInt(b.year) || 0));
    const annualPremium = parseFloat(policy.annualPremium) || 0;
    const paymentTerm = parseInt(policy.paymentTerm) || 0;
    const hasDividend = policy.designType === '分红型';
    const maturityAmount = parseFloat(policy.maturityAmount) || 0;
    const maturityDate = policy.maturityDate ? new Date(policy.maturityDate) : null;
    const startDate = policy.startDate ? new Date(policy.startDate) : null;
    const insuredAge = parseInt(policy.insuredAge) || 0;

    // 年金参数
    const isAnnuity = policy.productCategory === '年金保险' || policy.productCategory === '养老年金保险';
    let annuityStartYear = null;
    let annualPayout = 0;
    let monthlyPayout = 0;
    let isMonthly = false;
    if (isAnnuity && policy.annuityStartDate && startDate && !isNaN(startDate.getTime())) {
      const annuityStart = new Date(policy.annuityStartDate);
      if (!isNaN(annuityStart.getTime())) {
        annuityStartYear = Math.ceil((annuityStart - startDate) / (365.25 * 24 * 3600 * 1000));
        annualPayout = parseFloat(policy.annualPayout) || 0;
        monthlyPayout = parseFloat(policy.monthlyPayout) || 0;
        isMonthly = policy.isMonthlyPayout || false;
      }
    }

    // 满期年度
    let maturityYear = null;
    if (maturityDate && startDate && !isNaN(startDate.getTime()) && !isNaN(maturityDate.getTime())) {
      maturityYear = Math.round((maturityDate - startDate) / (365.25 * 24 * 3600 * 1000));
    }

    let maxYear = Math.max(
      parseInt(sorted[sorted.length - 1].year) || 0,
      sorted.length,
      maturityYear || 0
    );
    // 终身保单：限制至被保人105岁
    if (policy.coverageType === '终身' && insuredAge > 0) {
      const maxYearByAge = 105 - insuredAge + 1;
      if (maxYearByAge < maxYear) maxYear = maxYearByAge;
    }

    const rows = [];
    let cumDividend = 0;
    let cumAnnuity = 0;

    for (let y = 1; y <= maxYear; y++) {
      // 满期当年现金价值=0（满期金替代），但年金和红利仍需计入满期当年
      const cv = (maturityYear !== null && y >= maturityYear) ? 0 : interpolateValue(sorted, y, 'cashValue');
      const stopBeyondMaturity = maturityYear !== null && y > maturityYear;
      // 累计红利（满期次年起停止）
      if (hasDividend && !stopBeyondMaturity) {
        cumDividend = interpolateValue(sorted, y, 'dividend');
      }
      // 累计年金：满期次年停止；手动模式从表格取值，非手动用固定公式
      if (!stopBeyondMaturity) {
        if (policy.manualAnnuity && sorted[y - 1]) {
          // 手动输入模式：直接从表格取值累加（含0值，不退回固定公式）
          const row = sorted[y - 1];
          const annuityAmt = parseFloat(row.annuityAmount) || 0;
          // 排除转入万能的年金
          if (!row.transferToUA) {
            cumAnnuity += (isMonthly ? annuityAmt * 12 : annuityAmt);
          }
        } else if (isAnnuity && annuityStartYear !== null && y >= annuityStartYear) {
          // 非手动：固定公式
          const elapsed = y - annuityStartYear + 1;
          cumAnnuity = isMonthly ? elapsed * monthlyPayout * 12 : elapsed * annualPayout;
        }
      }
      // 满期金
      const matAmt = (maturityYear !== null && y === maturityYear) ? maturityAmount : 0;
      // 累计其他收入
      const cvOtherRow = sorted[y - 1] || {};
      const otherIncomeForYear = parseFloat(cvOtherRow.otherIncome || 0) || 0;
      // 累计已交保费
      const cumPremium = Math.min(y, paymentTerm) * annualPremium;
      // 生存总利益（不含其他）
      const totalBenefit = cv + cumDividend + cumAnnuity + matAmt;
      // 累计其他收入（累加到当前年度）
      let cumOtherIncome = 0;
      if (policy.hasOtherIncome) {
        for (let yy = 1; yy <= y; yy++) {
          const rrow = sorted[yy - 1];
          cumOtherIncome += parseFloat(rrow ? (rrow.otherIncome || 0) : 0) || 0;
        }
      }
      cumOtherIncome = Math.round(cumOtherIncome);
      // 总利益（含其他）
      const totalBenefitWithOther = totalBenefit + cumOtherIncome;

      rows.push({
        year: y,
        insuredAgeAtYear: insuredAge > 0 ? insuredAge + y - 1 : 0,
        cashValue: cv,
        cumDividend,
        cumAnnuity,
        maturityAmt: matAmt,
        cumPremium,
        totalBenefit,
        cumOtherIncome,
        totalBenefitWithOther
      });
    }
    return rows;
  }

  // 单保单入口（保持旧调用兼容）
  function computeBenefitData() {
    return computeSinglePolicyRows(getCurrentFormPolicy());
  }

  // 判断是否为"关联年金+万能"组合：
  // 恰两张保单、一张带 linkedUAPolicyId 的年金 + 一张带 fundFlows 的万能，
  // 且万能 transferRecords 中存在 sourcePolicyId === 年金.id。
  function isLinkedAnnuityUACombo(policyList) {
    if (!policyList || policyList.length !== 2) return null;
    const annuity = policyList.find(p => (p.productCategory === '年金保险' || p.productCategory === '养老年金保险') && p.linkedUAPolicyId);
    const ua = policyList.find(p => p.designType === '万能型' && p.universalAccount && p.universalAccount.fundFlows && p.universalAccount.fundFlows.length > 0);
    if (!annuity || !ua) return null;
    if (ua.id !== annuity.linkedUAPolicyId) return null;
    const linked = (ua.universalAccount.transferRecords || []).some(t => t.sourcePolicyId === annuity.id && parseFloat(t.amount) > 0);
    if (!linked) return null;
    return { annuity, ua };
  }

  // 组合（两张保单）合并利益行：按持有年度对齐叠加各分量
  function computeComboBenefitData(policyList) {
    if (!policyList || policyList.length === 0) return null;
    const combo = isLinkedAnnuityUACombo(policyList);
    const allRows = policyList.map(p => {
      if (combo && p.designType === '万能型') {
        // 关联组合：万能累计保费不含年金转入
        return computeSinglePolicyRows(p, { excludeTransferPremium: true });
      }
      return computeSinglePolicyRows(p);
    });
    if (allRows.some(r => !r || r.length === 0)) return null;
    const maxLen = Math.max(...allRows.map(r => r.length));
    const merged = [];
    for (let i = 0; i < maxLen; i++) {
      const parts = allRows.map(r => r[i]).filter(Boolean);
      if (parts.length === 0) break;
      const year = parts[0].year;
      const insuredAgeAtYear = parts[0].insuredAgeAtYear;
      const sum = (k) => parts.reduce((a, r) => a + (parseFloat(r[k]) || 0), 0);
      const cashValue = sum('cashValue');
      const cumDividend = sum('cumDividend');
      const cumAnnuity = sum('cumAnnuity');
      const maturityAmt = sum('maturityAmt');
      const cumPremium = sum('cumPremium');
      const cumOtherIncome = sum('cumOtherIncome');
      const totalBenefit = cashValue + cumDividend + cumAnnuity + maturityAmt;
      const totalBenefitWithOther = totalBenefit + cumOtherIncome;
      merged.push({ year, insuredAgeAtYear, cashValue, cumDividend, cumAnnuity, maturityAmt, cumPremium, totalBenefit, cumOtherIncome, totalBenefitWithOther });
    }
    return merged;
  }

  let _benefitUpdating = false; // guard against recursion

  // 基于保单周年日精确计算：投保日期下一年的同一天为第 1 个保单周年日
  function calcPolicyAnniversaryInfo(startDate, baseDate) {
    if (!startDate) return null;
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return null;
    const now = baseDate || new Date();
    // 统一按本地当天 00:00 计算，避免时间分量干扰天数
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const n = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (n < s) return { beforeStart: true };
    let years = n.getFullYear() - s.getFullYear();
    const ann = new Date(s.getFullYear() + years, s.getMonth(), s.getDate());
    if (n < ann) years--; // 今年周年日还没到，回退一年
    const currentAnn = new Date(s.getFullYear() + years, s.getMonth(), s.getDate());
    const nextAnn = new Date(s.getFullYear() + years + 1, s.getMonth(), s.getDate());
    const DAY = 24 * 3600 * 1000;
    return {
      beforeStart: false,
      annuityNumber: years,                          // 已过的保单周年数（从 1 开始）
      daysSince: Math.round((n - currentAnn) / DAY), // 距当前保单周年日已过天数
      daysToNext: Math.round((nextAnn - n) / DAY)    // 距下一个保单周年日剩余天数
    };
  }

  // 单保单利益演示上下文
  function singleBenefitCtx(policy, rows) {
    return {
      canvasId: 'benefitCanvas',
      tooltipId: 'benefitTooltip',
      tableId: 'benefitTable',
      chartContainerId: 'benefitChartContainer',
      tableWrapperId: 'benefitTableWrapper',
      summaryId: 'benefitSummary',
      emptyId: 'benefitEmpty',
      summaryTitleId: 'benefitSummaryTitle',
      bsSimpleId: 'bsSimple',
      bsIRRId: 'bsIRR',
      mode: getBenefitDemoMode(),
      sel: { get: () => benefitSelectedYear, set: (v) => { benefitSelectedYear = v; } },
      annivYear: computeAnnivYear(policy),
      hideAnnualPremium: false,
      annualPremium: parseFloat(policy.annualPremium) || 0,
      paymentTerm: parseInt(policy.paymentTerm) || 0,
      rowClickName: 'benefitTableRowClick',
      policyList: undefined,
      defaultYearFn: (rs) => {
        const paid = calcPaidYears(policy.startDate, policy.paymentTerm, baseDate);
        return Math.min(paid, rs[rs.length - 1].year);
      }
    };
  }

  function computeAnnivYear(policy) {
    if (!policy || !policy.startDate) return -1;
    const info = calcPolicyAnniversaryInfo(policy.startDate, baseDate);
    if (info && !info.beforeStart && info.annuityNumber >= 1) return info.annuityNumber;
    return -1;
  }

  // 通用渲染入口：单保单与组合共用
  function renderBenefitView(rows, bctx) {
    const emptyEl = document.getElementById(bctx.emptyId);
    const tableWrapper = document.getElementById(bctx.tableWrapperId);
    const summary = document.getElementById(bctx.summaryId);
    const chartContainer = document.getElementById(bctx.chartContainerId);

    if (!rows || rows.length === 0) {
      emptyEl.style.display = 'block';
      tableWrapper.style.display = 'none';
      summary.style.display = 'none';
      chartContainer.style.display = 'none';
      return;
    }
    emptyEl.style.display = 'none';
    tableWrapper.style.display = 'block';
    summary.style.display = 'grid';
    chartContainer.style.display = 'block';

    // 默认选中年度
    let sy = bctx.sel.get();
    if (sy === null || sy === undefined || !rows.find(r => r.year === sy)) {
      sy = bctx.defaultYearFn ? bctx.defaultYearFn(rows) : rows[0].year;
      bctx.sel.set(sy);
    }

    drawBenefitChart(rows, bctx);
    renderBenefitTable(rows, bctx);
    refreshBenefitSummaryOnly(rows, bctx);

    // 重绘选中竖线
    const canvas = document.getElementById(bctx.canvasId);
    if (canvas && canvas._benefitRows && canvas._benefitRedrawWithIndicator) {
      const idx = canvas._benefitRows.findIndex(r2 => r2.year === bctx.sel.get());
      if (idx >= 0) canvas._benefitRedrawWithIndicator(idx);
    }
  }

  function renderBenefitDemo() {
    if (_benefitUpdating) return;
    _benefitUpdating = true;
    try {
      // 右侧提示：基准日期与保单周年日信息
      const policy = getCurrentFormPolicy();
      const baseInfoEl = document.getElementById('benefitBaseInfo');
      if (baseInfoEl) {
        const fmt = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`;
        if (policy && policy.startDate) {
          const maturityDate = policy.maturityDate ? new Date(policy.maturityDate) : null;
          const isMatured = maturityDate && !isNaN(maturityDate.getTime()) && baseDate >= maturityDate;
          if (isMatured) {
            const mfmt = `${maturityDate.getFullYear()}-${String(maturityDate.getMonth() + 1).padStart(2, '0')}-${String(maturityDate.getDate()).padStart(2, '0')}`;
            baseInfoEl.innerHTML = `基准日期：<b>${fmt}</b><br>保单已满期，满期日期：<b>${mfmt}</b>`;
          } else {
            const info = calcPolicyAnniversaryInfo(policy.startDate, baseDate);
            if (info && info.beforeStart) {
              baseInfoEl.innerHTML = `基准日期：<b>${fmt}</b><br>早于保单起期，尚未生效`;
            } else if (info) {
              const sinceText = info.annuityNumber === 0
                ? `保单生效日 + <b>${info.daysSince}</b> 天`
                : `第 <b>${info.annuityNumber}</b> 个保单周年日 + <b>${info.daysSince}</b> 天`;
              baseInfoEl.innerHTML = `基准日期：<b>${fmt}</b>，${sinceText}<br>距离下一个保单周年日还有 <b>${info.daysToNext}</b> 天`;
            }
          }
        } else {
          baseInfoEl.innerHTML = `基准日期：<b>${fmt}</b>`;
        }
      }

      const rows = computeBenefitData();
      renderBenefitView(rows, singleBenefitCtx(policy, rows));
    } finally {
      _benefitUpdating = false;
    }
  }

  function drawBenefitChart(rows, bctx) {
    const container = document.getElementById(bctx.chartContainerId);
    const canvas = document.getElementById(bctx.canvasId);
    const tooltip = document.getElementById(bctx.tooltipId);
    const mode = bctx.mode;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = 350;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const pad = { top: 30, right: 30, bottom: 50, left: 70 };
    const pw = w - pad.left - pad.right;
    const ph = h - pad.top - pad.bottom;

    // 找最大值
    let maxVal = 0;
    rows.forEach(r => {
      if (r.cumPremium > maxVal) maxVal = r.cumPremium;
      const bv = getBenefitValue(r, mode);
      if (bv > maxVal) maxVal = bv;
    });
    if (maxVal === 0) maxVal = 1;
    // 向上取整到漂亮的值
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
    maxVal = Math.ceil(maxVal / magnitude) * magnitude;

    const xScale = pw / (rows.length - 1 || 1);
    const yScale = ph / maxVal;

    function x(yearIndex) { return pad.left + yearIndex * xScale; }
    function y(val) { return pad.top + ph - val * yScale; }

    // 清空
    ctx.clearRect(0, 0, w, h);

    // 背景网格
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const yy = pad.top + (ph / ySteps) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, yy);
      ctx.lineTo(w - pad.right, yy);
      ctx.stroke();
      // Y 轴标签
      const val = maxVal - (maxVal / ySteps) * i;
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(showAmounts ? formatMoney(val) : '***', pad.left - 6, yy + 4);
    }
    // X轴标签(每5年)
    for (let i = 0; i < rows.length; i += 5) {
      const xx = x(i);
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(rows[i].year, xx, h - pad.bottom + 18);
    }

    // 图例
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(pad.left, 8, 12, 3);
    ctx.fillStyle = '#374151';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('累计已交保费', pad.left + 16, 12);

    ctx.fillStyle = '#059669';
    ctx.fillRect(pad.left + 120, 8, 12, 3);
    ctx.fillStyle = '#374151';
    ctx.fillText(getBenefitLabel(mode), pad.left + 136, 12);

    // 画线 - 累计保费（蓝色）
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    rows.forEach((r, i) => {
      const xi = x(i), yi = y(r.cumPremium);
      if (i === 0) ctx.moveTo(xi, yi);
      else ctx.lineTo(xi, yi);
    });
    ctx.stroke();

    // 生存总利益（绿色）
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    rows.forEach((r, i) => {
      const xi = x(i), yi = y(getBenefitValue(r, mode));
      if (i === 0) ctx.moveTo(xi, yi);
      else ctx.lineTo(xi, yi);
    });
    ctx.stroke();

    // 存储 rows 和 drawVerticalIndicator 引用到 canvas，供外部（表格点击）使用
    canvas._benefitRows = rows;
    canvas._benefitChartParams = { w, h, pad, ph, xScale, yScale, x, y };
    canvas._benefitRedrawWithIndicator = drawVerticalIndicator;

    // 鼠标交互
    function handleMouseMove(e) {
      const rect2 = canvas.getBoundingClientRect();
      const mx = e.clientX - rect2.left;
      const my = e.clientY - rect2.top;
      const rows2 = canvas._benefitRows;
      const params = canvas._benefitChartParams || { x, pad, h };
      if (!rows2 || rows2.length === 0) return;

      const yearIndex = Math.round((mx - params.pad.left) / params.xScale);
      const idx = Math.max(0, Math.min(rows2.length - 1, yearIndex));
      const rr = rows2[idx];

      // 更新tooltip
      tooltip.innerHTML = `
        <div class="tt-year">第 ${rr.year} 保单年度${rr.insuredAgeAtYear > 0 ? '（被保人' + rr.insuredAgeAtYear + '岁）' : ''}</div>
        <div class="tt-row"><span class="tt-label">累计保费</span><span class="tt-val">${showAmounts ? '¥' + formatMoney(rr.cumPremium) : '¥***'}</span></div>
        <div class="tt-row"><span class="tt-label">现金价值</span><span class="tt-val">${showAmounts ? '¥' + formatMoney(rr.cashValue) : '¥***'}</span></div>
        <div class="tt-row"><span class="tt-label">累计红利</span><span class="tt-val">${showAmounts ? '¥' + formatMoney(rr.cumDividend) : '¥***'}</span></div>
        <div class="tt-row"><span class="tt-label">累计年金</span><span class="tt-val">${showAmounts ? '¥' + formatMoney(rr.cumAnnuity) : '¥***'}</span></div>
        <div class="tt-row"><span class="tt-label">满期金</span><span class="tt-val">${showAmounts ? '¥' + formatMoney(rr.maturityAmt) : '¥***'}</span></div>
        <div class="tt-row" style="border-top:1px solid rgba(255,255,255,0.2);margin-top:4px;padding-top:4px;"><span class="tt-label" style="color:#fbbf24;">生存总利益</span><span class="tt-val" style="color:#fbbf24;">${showAmounts ? '¥' + formatMoney(rr.totalBenefit) : '¥***'}</span></div>
      `;
      tooltip.style.display = 'block';

      // 定位 tooltip：右侧溢出时翻转到鼠标左侧
      const ttWidth = tooltip.offsetWidth || 180;
      let tx = mx + 16;
      if (tx + ttWidth > params.w - 10) {
        tx = mx - ttWidth - 16;
      }
      const ty = Math.min(my - 10, params.h - 200);
      tooltip.style.left = tx + 'px';
      tooltip.style.top = ty + 'px';

      // 重绘竖线指示器
      drawVerticalIndicator(idx);

      // 鼠标滑动时实时更新下方单利/复利卡片和表格选中行
      bctx.sel.set(rr.year);
      refreshBenefitSummaryOnly(rows2, bctx);
    }

    function drawVerticalIndicator(idx) {
      // 通过覆盖层的方式做竖线 - 直接用ctx重绘线条和竖线
      const params2 = canvas._benefitChartParams || { x, pad, h, ph, y };
      // 重绘整体
      ctx.clearRect(0, 0, w, h);
      // 背景网格
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 5; i++) {
        const yy = params2.pad.top + (params2.ph / 5) * i;
        ctx.beginPath();
        ctx.moveTo(params2.pad.left, yy);
        ctx.lineTo(w - params2.pad.right, yy);
        ctx.stroke();
        const val = maxVal - (maxVal / 5) * i;
        ctx.fillStyle = '#6b7280';
        ctx.font = '11px -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(showAmounts ? formatMoney(val) : '***', params2.pad.left - 6, yy + 4);
      }
      for (let i = 0; i < rows.length; i += 5) {
        const xx = params2.x(i);
        ctx.fillStyle = '#6b7280';
        ctx.font = '11px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(rows[i].year, xx, h - params2.pad.bottom + 18);
      }
      // 图例
      ctx.fillStyle = '#1e40af'; ctx.fillRect(params2.pad.left, 8, 12, 3);
      ctx.fillStyle = '#374151'; ctx.font = '11px -apple-system, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('累计已交保费', params2.pad.left + 16, 12);
      ctx.fillStyle = '#059669'; ctx.fillRect(params2.pad.left + 120, 8, 12, 3);
      ctx.fillText(getBenefitLabel(mode), params2.pad.left + 136, 12);

      // 保费线
      ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 2; ctx.setLineDash([]);
      ctx.beginPath();
      rows.forEach((r, i) => { const xi = params2.x(i), yi = params2.y(r.cumPremium); if (i === 0) ctx.moveTo(xi, yi); else ctx.lineTo(xi, yi); });
      ctx.stroke();
      // 利益线
      ctx.strokeStyle = '#059669'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      rows.forEach((r, i) => { const xi = params2.x(i), yi = params2.y(getBenefitValue(r, mode)); if (i === 0) ctx.moveTo(xi, yi); else ctx.lineTo(xi, yi); });
      ctx.stroke();

      // 竖线
      const r3 = rows[idx];
      const vx = params2.x(idx);
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(vx, params2.pad.top);
      ctx.lineTo(vx, h - params2.pad.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // 数据点
      ctx.fillStyle = '#1e40af';
      ctx.beginPath();
      ctx.arc(vx, params2.y(r3.cumPremium), 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(vx, params2.y(getBenefitValue(r3, mode)), 5, 0, Math.PI * 2);
      ctx.fill();
    }

    function handleMouseLeave() {
      tooltip.style.display = 'none';
      bctx.sel.set(null);
      drawBenefitChartStatic();
      refreshBenefitSummaryOnly(rows, bctx);
    }

    function handleClick(e) {
      const rect3 = canvas.getBoundingClientRect();
      const mx = e.clientX - rect3.left;
      const params3 = canvas._benefitChartParams || { x, pad };
      const rows3 = canvas._benefitRows;
      if (!rows3) return;
      const idx = Math.round((mx - params3.pad.left) / params3.xScale);
      const ci = Math.max(0, Math.min(rows3.length - 1, idx));
      bctx.sel.set(rows3[ci].year);
      refreshBenefitSummaryOnly(rows3, bctx);
      drawVerticalIndicator(ci);
      handleMouseMove(e);
    }

    function drawBenefitChartStatic() {
      const params4 = canvas._benefitChartParams || { x, pad, h, ph, y };
      ctx.clearRect(0, 0, w, h);
      // 网络 + 标签
      ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 0.5;
      for (let i = 0; i <= 5; i++) { const yy = params4.pad.top + (params4.ph / 5) * i; ctx.beginPath(); ctx.moveTo(params4.pad.left, yy); ctx.lineTo(w - params4.pad.right, yy); ctx.stroke(); const val = maxVal - (maxVal / 5) * i; ctx.fillStyle = '#6b7280'; ctx.font = '11px -apple-system, sans-serif'; ctx.textAlign = 'right'; ctx.fillText(showAmounts ? formatMoney(val) : '***', params4.pad.left - 6, yy + 4); }
      for (let i = 0; i < rows.length; i += 5) { const xx = params4.x(i); ctx.fillStyle = '#6b7280'; ctx.font = '11px -apple-system, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(rows[i].year, xx, h - params4.pad.bottom + 18); }
      ctx.fillStyle = '#1e40af'; ctx.fillRect(params4.pad.left, 8, 12, 3); ctx.fillStyle = '#374151'; ctx.font = '11px -apple-system, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('累计已交保费', params4.pad.left + 16, 12);
      ctx.fillStyle = '#059669'; ctx.fillRect(params4.pad.left + 120, 8, 12, 3); ctx.fillText(getBenefitLabel(mode), params4.pad.left + 136, 12);
      ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 2; ctx.setLineDash([]); ctx.beginPath(); rows.forEach((r, i) => { const xi = params4.x(i), yi = params4.y(r.cumPremium); if (i === 0) ctx.moveTo(xi, yi); else ctx.lineTo(xi, yi); }); ctx.stroke();
      ctx.strokeStyle = '#059669'; ctx.lineWidth = 2.5; ctx.beginPath(); rows.forEach((r, i) => { const xi = params4.x(i), yi = params4.y(getBenefitValue(r, mode)); if (i === 0) ctx.moveTo(xi, yi); else ctx.lineTo(xi, yi); }); ctx.stroke();
    }

    canvas.onmousemove = handleMouseMove;
    canvas.onmouseleave = handleMouseLeave;
    canvas.onclick = handleClick;
    // touch
    canvas.ontouchmove = function(e) { e.preventDefault(); handleMouseMove(e.touches[0]); };
    canvas.ontouchend = function(e) { handleMouseLeave(); };
    canvas.ontouchstart = function(e) { e.preventDefault(); handleClick(e.touches[0]); };

    drawBenefitChartStatic();
    // 重绘选中状态
    if (bctx.sel.get()) {
      const idx = rows.findIndex(r => r.year === bctx.sel.get());
      if (idx >= 0) drawVerticalIndicator(idx);
    }
  }

  function renderBenefitTable(rows, bctx) {
    const tbl = document.getElementById(bctx.tableId);
    const hasDividend = rows.some(r => r.cumDividend > 0);
    const hasAnnuity = rows.some(r => r.cumAnnuity > 0);
    const hasMaturity = rows.some(r => r.maturityAmt > 0);
    const annivYear = (bctx.annivYear !== undefined && bctx.annivYear !== null) ? bctx.annivYear : -1;

    let cols = ['保单年度', '被保人年龄'];
    if (!bctx.hideAnnualPremium) cols.push('年交保费');
    cols.push('累计保费', '现金价值');
    if (hasDividend) cols.push('累计红利');
    if (hasAnnuity) cols.push('累计年金');
    if (hasMaturity) cols.push('满期金');
    cols.push(getBenefitLabel(bctx.mode));

    tbl.innerHTML = `
      <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
      <tbody>
        ${rows.map(r => {
          const selClass = (bctx.sel.get() === r.year) ? ' selected' : '';
          const isAnniv = (annivYear === r.year);
          let row = `<tr class="${selClass}${isAnniv ? ' benefit-row-anniv' : ''}" onclick="${bctx.rowClickName}(${r.year})">`;
          row += `<td>${r.year}</td>`;
          row += `<td>${r.insuredAgeAtYear > 0 ? r.insuredAgeAtYear : '-'}</td>`;
          if (!bctx.hideAnnualPremium) {
            row += `<td>${showAmounts ? formatMoney(Math.min(r.year, bctx.paymentTerm || 0) * (bctx.annualPremium || 0)) : '***'}</td>`;
          }
          row += `<td>${showAmounts ? formatMoney(r.cumPremium) : '***'}</td>`;
          row += `<td>${showAmounts ? formatMoney(r.cashValue) : '***'}</td>`;
          if (hasDividend) row += `<td>${showAmounts ? formatMoney(r.cumDividend) : '***'}</td>`;
          if (hasAnnuity) row += `<td>${showAmounts ? formatMoney(r.cumAnnuity) : '***'}</td>`;
          if (hasMaturity) row += `<td>${showAmounts ? formatMoney(r.maturityAmt) : '***'}</td>`;
          row += `<td style="font-weight:${isAnniv ? 700 : 600};color:#059669;">${showAmounts ? formatMoney(getBenefitValue(r, bctx.mode)) : '***'}</td>`;
          row += '</tr>';
          return row;
        }).join('')}
      </tbody>
    `;
  }

  function benefitTableRowClick(year) {
    if (_benefitUpdating) return;
    benefitSelectedYear = year;
    const rows = computeBenefitData();
    if (!rows) return;
    const policy = getCurrentFormPolicy();
    const bctx = singleBenefitCtx(policy, rows);
    refreshBenefitSummaryOnly(rows, bctx);
    updateBenefitTableSelection(bctx);
    const canvas = document.getElementById('benefitCanvas');
    if (canvas && canvas._benefitRedrawWithIndicator && canvas._benefitRows) {
      const idx = canvas._benefitRows.findIndex(r2 => r2.year === year);
      if (idx >= 0) canvas._benefitRedrawWithIndicator(idx);
    }
  }

  function updateBenefitTableSelection(bctx) {
    document.querySelectorAll('#' + bctx.tableId + ' tbody tr').forEach(tr => {
      const td = tr.querySelector('td');
      if (td && parseInt(td.textContent) === bctx.sel.get()) {
        tr.classList.add('selected');
      } else {
        tr.classList.remove('selected');
      }
    });
  }

  // 仅更新概要卡片，不做任何图表重绘（避免递归）
  function refreshBenefitSummaryOnly(rows, bctx) {
    if (!rows || rows.length === 0) return;
    let r = rows.find(r2 => r2.year === bctx.sel.get()) || rows[0];
    if (!r) return;
    bctx.sel.set(r.year);

    document.getElementById(bctx.summaryTitleId).textContent = `第 ${r.year} 保单年度利益测算`;
    const sr = calcSimpleReturn(r, bctx.mode);
    const sEl = document.getElementById(bctx.bsSimpleId);
    sEl.textContent = sr.toFixed(2) + '%';
    sEl.className = 'bs-val ' + (sr >= 0 ? 'positive' : 'negative');

    const irrVal = calcIRR(r, rows, bctx.policyList);
    const iEl = document.getElementById(bctx.bsIRRId);
    iEl.textContent = irrVal.toFixed(2) + '%';
    iEl.className = 'bs-val ' + (irrVal >= 0 ? 'positive' : 'negative');

    updateBenefitTableSelection(bctx);
  }

  // 兼容旧调用
  function updateBenefitSummary(rows) {
    const policy = getCurrentFormPolicy();
    refreshBenefitSummaryOnly(rows, singleBenefitCtx(policy, rows));
  }

  function drawBenefitChartStatic() {
    // no-op: chart redraw handled by canvas event handlers
  }

  function calcSimpleReturn(r, mode) {
    if (r.cumPremium === 0) return 0;
    const bv = getBenefitValue(r, mode);
    return (bv - r.cumPremium) / r.cumPremium / r.year * 100;
  }

  function calcIRR(selectedRow, allRows, policyList) {
    if (policyList && policyList.length === 2) {
      return calcComboIRR(selectedRow, allRows, policyList);
    }
    const policy = getCurrentFormPolicy();
    if (!policy) return 0;
    const year = selectedRow.year;

    // 万能型：按实际资金出入（自有流水 + 年金转入）和账户价值计算IRR
    if (policy.designType === '万能型' && policy.universalAccount && policy.universalAccount.fundFlows) {
      const ua = policy.universalAccount;
      const fundFlows = ua.fundFlows || [];
      const transferRecords = ua.transferRecords || [];   // 年金转入记录
      const startDate = policy.startDate ? new Date(policy.startDate) : null;
      if (!startDate || isNaN(startDate.getTime())) return 0;

      const YEAR_MS = 365.25 * 24 * 3600 * 1000;
      // 按保单年度汇总净现金流（投资者视角：流出为负，流入为正）
      const yearlyNetCF = {};
      function bucketYear(dateStr) {
        const fd = new Date(dateStr);
        if (isNaN(fd.getTime())) return null;
        return Math.ceil((fd - startDate) / YEAR_MS); // 起始日（第0年）也计入
      }
      function addFlow(dateStr, flowType, amount, feeRate) {
        const y = bucketYear(dateStr);
        if (y === null || y < 0) return;
        if (!yearlyNetCF[y]) yearlyNetCF[y] = 0;
        const amt = parseFloat(amount) || 0;
        const fee = amt * (parseFloat(feeRate || 0) / 100);
        if (flowType === 'in') {
          yearlyNetCF[y] -= (amt - fee); // 成本基数 = 净投入（amount - fee）
        } else {
          yearlyNetCF[y] += (amt - fee); // 领取 = 到账金额（已扣手续费）
        }
      }

      // 1) 自有资金流水
      fundFlows.forEach(f => addFlow(f.date, f.flowType, f.amount, f.feeRate));
      // 2) 年金转入：视为投资者投入，计入万能账户 IRR 成本基数
      transferRecords.forEach(t => {
        if (parseFloat(t.amount) > 0) addFlow(t.date, 'in', t.amount, t.feeRate || 0);
      });

      const maxY = year;
      // 现金流数组：index = 保单年度（含第0年）
      const cashflows = [];
      for (let y = 0; y <= maxY; y++) cashflows.push(yearlyNetCF[y] || 0);

      // 3) 手续费返还：计入现金流（按年归集，避免与终端账户价值重复）
      //    终端值改用账户价值(=现金价值-累计返还)，返还作为独立正现金流，二者不重复
      //    直接从实时计算的 _uaCache 读取，不再依赖落盘的 cashValues
      let uaCached = (typeof _uaCache !== 'undefined' && _uaCache[policy.id]) || null;
      if (!uaCached && typeof recalcUAAccountSilent === 'function') {
        uaCached = recalcUAAccountSilent(); // 兜底：缓存缺失时按源数据重算
      }
      const uaAnnualRows = uaCached && uaCached.annualRows ? uaCached.annualRows : [];
      const cumFeeReturnByYear = {};
      uaAnnualRows.forEach(r => { cumFeeReturnByYear[r.year] = parseFloat(r.cumFeeReturn) || 0; });
      let prevCum = 0;
      for (let y = 0; y <= maxY; y++) {
        const cum = cumFeeReturnByYear[y] || 0;
        const ret = cum - prevCum;
        if (ret > 0) cashflows[y] += ret;  // 手续费返还 = 现金流入
        prevCum = cum;
      }
      const terminalCumFeeReturn = cumFeeReturnByYear[maxY] || 0;
      // 末年：账户价值（不含已返还手续费，因返还已单独计入）+ 当年净现金流
      cashflows[maxY] += (selectedRow.cashValue || 0) - terminalCumFeeReturn;

      // Newton's method
      function npv(rate) {
        let total = 0;
        for (let t = 0; t < cashflows.length; t++) {
          total += cashflows[t] / Math.pow(1 + rate, t);
        }
        return total;
      }
      let guess = 0.03;
      for (let iter = 0; iter < 100; iter++) {
        const f = npv(guess);
        if (Math.abs(f) < 0.1) break;
        const h = 0.0001;
        const df = (npv(guess + h) - npv(guess - h)) / (2 * h);
        if (Math.abs(df) < 1e-12) break;
        guess = guess - f / df;
        if (guess < -0.99) guess = -0.5;
        if (guess > 10) guess = 3;
      }
      return guess * 100;
    }

    // 非万能型：原有逻辑
    const annualPremium = parseFloat(policy.annualPremium) || 0;
    const paymentTerm = parseInt(policy.paymentTerm) || 0;

    const cashflows = [];
    // year 0: pay premium
    cashflows.push(-annualPremium);
    for (let y = 1; y < year; y++) {
      cashflows.push(y < paymentTerm ? -annualPremium : 0);
    }
    // final year: receive benefitValue, no premium paid at end
    cashflows.push(getBenefitValue(selectedRow));

    // Newton's method
    function npv(rate) {
      let total = 0;
      for (let t = 0; t < cashflows.length; t++) {
        total += cashflows[t] / Math.pow(1 + rate, t);
      }
      return total;
    }

    let guess = 0.03;
    for (let iter = 0; iter < 100; iter++) {
      const f = npv(guess);
      if (Math.abs(f) < 0.1) break;
      // derivative approximation
      const h = 0.0001;
      const df = (npv(guess + h) - npv(guess - h)) / (2 * h);
      if (Math.abs(df) < 1e-12) break;
      guess = guess - f / df;
      if (guess < -0.99) guess = -0.5;
      if (guess > 10) guess = 3;
    }

    return guess * 100;
  }

  // 关联年金+万能组合 IRR（新公式）：
  //  成本 = 年金缴费 + 万能主动资金流入/流出(净手续费)
  //  年金转入万能 = 完全不计（内部搬运）
  //  末年收益 = 万能账户价值 + 年金现金价值 + 未转入累计年金
  function calcLinkedComboIRR(selectedRow, policyList, combo, YEAR_MS) {
    const { annuity, ua } = combo;
    const starts = policyList.map(p => new Date(p.startDate));
    const base0 = new Date(Math.min(starts[0].getTime(), starts[1].getTime()));
    const cashflows = [];
    const pushCF = (g, amt) => { cashflows[g] = (cashflows[g] || 0) + amt; };

    // 1. 年金缴费（成本），按缴费期对齐到最早投保日
    const aS = new Date(annuity.startDate);
    const aDiff = Math.round((aS - base0) / YEAR_MS);
    const ap = parseFloat(annuity.annualPremium) || 0;
    const apt = parseInt(annuity.paymentTerm) || 0;
    for (let t = 1; t <= apt; t++) pushCF((t - 1) + aDiff, -ap);

    // 2. 万能主动资金流入/流出（净手续费），年金转入完全忽略
    const uaResult = getUAResult(ua);
    const uaS = new Date(ua.startDate);
    const uaDiff = Math.round((uaS - base0) / YEAR_MS);
    function bucket(dateStr) {
      const fd = new Date(dateStr);
      if (isNaN(fd.getTime())) return null;
      return Math.ceil((fd - base0) / YEAR_MS);
    }
    function addFlow(dateStr, flowType, amount, feeRate) {
      const y = bucket(dateStr);
      if (y === null || y < 0) return;
      if (!cashflows[y]) cashflows[y] = 0;
      const amt = parseFloat(amount) || 0;
      const fee = amt * (parseFloat(feeRate || 0) / 100);
      if (flowType === 'in') cashflows[y] -= (amt - fee);
      else cashflows[y] += (amt - fee);
    }
    (ua.universalAccount.fundFlows || []).forEach(f => addFlow(f.date, f.flowType, f.amount, f.feeRate));
    // transferRecords 完全忽略：年金转入万能为内部搬运，不计入现金流

    // 3. 末年收益 = 万能账户价值 + 年金现金价值 + 未转入累计年金（全局年度对齐取值）
    const selectedGlobalYear = Math.max(0, (selectedRow.year - 1));
    const aRows = computeSinglePolicyRows(annuity);
    const uRows = uaResult && uaResult.annualRows;
    const pick = (rows, diff) => {
      let b = null;
      (rows || []).forEach(r => { if ((r.year || 0) + diff <= selectedGlobalYear) b = r; });
      return b;
    };
    const aRow = pick(aRows, aDiff);
    const uRow = pick(uRows, uaDiff);
    const transferred = (ua.universalAccount.transferRecords || [])
      .filter(t => t.sourcePolicyId === annuity.id)
      .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    // 手动模式 cumAnnuity 已不含转入；非手动则扣掉年金转入部分
    const nonXferAnnuity = annuity.manualAnnuity
      ? (aRow ? aRow.cumAnnuity : 0)
      : Math.max(0, (aRow ? aRow.cumAnnuity : 0) - transferred);
    const benefit = (uRow ? uRow.accountValue : 0) + (aRow ? aRow.cashValue : 0) + nonXferAnnuity;
    pushCF(selectedGlobalYear, benefit);

    const maxY = selectedGlobalYear;
    for (let y = 0; y <= maxY; y++) if (cashflows[y] === undefined) cashflows[y] = 0;

    function npv(rate) {
      let total = 0;
      for (let t = 0; t <= maxY; t++) total += cashflows[t] / Math.pow(1 + rate, t);
      return total;
    }
    let guess = 0.03;
    for (let iter = 0; iter < 100; iter++) {
      const f = npv(guess);
      if (Math.abs(f) < 0.1) break;
      const h = 0.0001;
      const df = (npv(guess + h) - npv(guess - h)) / (2 * h);
      if (Math.abs(df) < 1e-12) break;
      guess = guess - f / df;
      if (guess < -0.99) guess = -0.5;
      if (guess > 10) guess = 3;
    }
    return guess * 100;
  }

  // 组合（两张保单）IRR：按"投资者净现金流"合并，各保单现金流对齐到最早投保日
  function calcComboIRR(selectedRow, allRows, policyList) {
    const YEAR_MS = 365.25 * 24 * 3600 * 1000;
    const combo = isLinkedAnnuityUACombo(policyList);
    if (combo) return calcLinkedComboIRR(selectedRow, policyList, combo, YEAR_MS);
    const starts = policyList.map(p => new Date(p.startDate));
    const base0 = new Date(Math.min(starts[0].getTime(), starts[1].getTime()));
    const selectedGlobalYear = Math.max(0, (selectedRow.year - 1));
    const cashflows = [];
    const pushCF = (g, amt) => { cashflows[g] = (cashflows[g] || 0) + amt; };

    policyList.forEach(p => {
      const S = new Date(p.startDate);
      const yearDiff = Math.round((S - base0) / YEAR_MS); // 0 或 1
      if (p.designType === '万能型' && p.universalAccount && p.universalAccount.fundFlows && p.universalAccount.fundFlows.length > 0) {
        const uaResult = getUAResult(p);
        function bucket(dateStr) {
          const fd = new Date(dateStr);
          if (isNaN(fd.getTime())) return null;
          return Math.ceil((fd - base0) / YEAR_MS);
        }
        function addFlow(dateStr, flowType, amount, feeRate) {
          const y = bucket(dateStr);
          if (y === null || y < 0) return;
          if (!cashflows[y]) cashflows[y] = 0;
          const amt = parseFloat(amount) || 0;
          const fee = amt * (parseFloat(feeRate || 0) / 100);
          if (flowType === 'in') cashflows[y] -= (amt - fee);
          else cashflows[y] += (amt - fee);
        }
        (p.universalAccount.fundFlows || []).forEach(f => addFlow(f.date, f.flowType, f.amount, f.feeRate));
        const otherPolicyIds = policyList.map(q => q.id);
        (p.universalAccount.transferRecords || []).forEach(t => {
          // 来自组合内另一张保单的内部年金转入：成本已在年金侧计入，组合 IRR 不再重复计入
          if (parseFloat(t.amount) > 0 && otherPolicyIds.includes(t.sourcePolicyId)) return;
          if (parseFloat(t.amount) > 0) addFlow(t.date, 'in', t.amount, t.feeRate || 0);
        });
        if (uaResult && uaResult.annualRows) {
          const cumFee = {};
          uaResult.annualRows.forEach(r => { cumFee[r.year] = parseFloat(r.cumFeeReturn) || 0; });
          let prev = 0;
          for (let y = 0; y <= 100; y++) {
            const cum = cumFee[y] || 0;
            const ret = cum - prev;
            if (ret > 0) pushCF(y, ret);
            prev = cum;
          }
        }
      } else {
        const ap = parseFloat(p.annualPremium) || 0;
        const pt = parseInt(p.paymentTerm) || 0;
        for (let t = 1; t <= pt; t++) pushCF((t - 1) + yearDiff, -ap);
      }
    });

    // 末年：组合总利益（年金转万能已在各自计算中排除/计入，无重复）
    pushCF(selectedGlobalYear, getBenefitValue(selectedRow, 'total'));

    const maxY = selectedGlobalYear;
    for (let y = 0; y <= maxY; y++) if (cashflows[y] === undefined) cashflows[y] = 0;

    function npv(rate) {
      let total = 0;
      for (let t = 0; t <= maxY; t++) total += cashflows[t] / Math.pow(1 + rate, t);
      return total;
    }
    let guess = 0.03;
    for (let iter = 0; iter < 100; iter++) {
      const f = npv(guess);
      if (Math.abs(f) < 0.1) break;
      const h = 0.0001;
      const df = (npv(guess + h) - npv(guess - h)) / (2 * h);
      if (Math.abs(df) < 1e-12) break;
      guess = guess - f / df;
      if (guess < -0.99) guess = -0.5;
      if (guess > 10) guess = 3;
    }
    return guess * 100;
  }

  // 组合利益演示：两张保单合并渲染到独立模态
  function renderComboBenefit(policyList) {
    const rows = computeComboBenefitData(policyList);
    if (!rows || rows.length === 0) {
      alert('所选保单缺少现金价值/利益数据，无法组合演示');
      return;
    }
    _comboRows = rows;
    _comboPolicyList = policyList;

    const bctx = {
      canvasId: 'comboBenefitCanvas',
      tooltipId: 'comboBenefitTooltip',
      tableId: 'comboBenefitTable',
      chartContainerId: 'comboBenefitChartContainer',
      tableWrapperId: 'comboBenefitTableWrapper',
      summaryId: 'comboBenefitSummary',
      emptyId: 'comboBenefitEmpty',
      summaryTitleId: 'comboBenefitSummaryTitle',
      bsSimpleId: 'comboBsSimple',
      bsIRRId: 'comboBsIRR',
      mode: 'total',
      sel: { get: () => _comboSelectedYear, set: (v) => { _comboSelectedYear = v; } },
      annivYear: -1,
      hideAnnualPremium: true,
      rowClickName: 'comboBenefitTableRowClick',
      policyList: policyList,
      defaultYearFn: (rs) => rs[0].year
    };
    renderBenefitView(rows, bctx);
  }

  function comboBenefitTableRowClick(year) {
    if (_benefitUpdating) return;
    _comboSelectedYear = year;
    const rows = _comboRows;
    if (!rows) return;
    // 组合上下文
    const bctx = {
      canvasId: 'comboBenefitCanvas',
      tooltipId: 'comboBenefitTooltip',
      tableId: 'comboBenefitTable',
      chartContainerId: 'comboBenefitChartContainer',
      tableWrapperId: 'comboBenefitTableWrapper',
      summaryId: 'comboBenefitSummary',
      emptyId: 'comboBenefitEmpty',
      summaryTitleId: 'comboBenefitSummaryTitle',
      bsSimpleId: 'comboBsSimple',
      bsIRRId: 'comboBsIRR',
      mode: 'total',
      sel: { get: () => _comboSelectedYear, set: (v) => { _comboSelectedYear = v; } },
      annivYear: -1,
      hideAnnualPremium: true,
      rowClickName: 'comboBenefitTableRowClick',
      policyList: _comboPolicyList,
      defaultYearFn: (rs) => rs[0].year
    };
    refreshBenefitSummaryOnly(rows, bctx);
    updateBenefitTableSelection(bctx);
    const canvas = document.getElementById('comboBenefitCanvas');
    if (canvas && canvas._benefitRedrawWithIndicator && canvas._benefitRows) {
      const idx = canvas._benefitRows.findIndex(r2 => r2.year === year);
      if (idx >= 0) canvas._benefitRedrawWithIndicator(idx);
    }
  }

  // ===== 现金价值表格 =====
  function updateCashValueTable() {
    const body = document.getElementById('cashValueBody');
    const policy = getCurrentFormPolicy();
    const cashValues = policy && policy.cashValues ? policy.cashValues : [];
    if (!policy || !policy.id) {
      if (!document.getElementById('cashValueBody').dataset.temp) {
        document.getElementById('cashValueBody').dataset.temp = '[]';
      }
    }
    const hasDividend = document.getElementById('designType').value === '分红型';
    const isAnnuity = document.getElementById('productCategory').value === '年金保险' || document.getElementById('productCategory').value === '养老年金保险';
    const showManualAnnuity = document.getElementById('manualAnnuity').checked;
    const showTransferToUA = document.getElementById('transferToUA').checked && document.getElementById('linkedUAPolicy').value;
    const hasOtherIncomeEl = document.getElementById('hasOtherIncome');
    const hasOtherIncome = hasOtherIncomeEl ? hasOtherIncomeEl.checked : false;

    document.getElementById('dividendColHeader').style.display = hasDividend ? '' : 'none';
    document.getElementById('distributedColHeader').style.display = hasDividend ? '' : 'none';
    document.getElementById('annuityColHeader').style.display = showManualAnnuity ? '' : 'none';
    document.getElementById('transferColHeader').style.display = showTransferToUA ? '' : 'none';
    document.getElementById('otherIncomeColHeader').style.display = hasOtherIncome ? '' : 'none';
    document.getElementById('transferBatchOps').style.display = showTransferToUA ? 'flex' : 'none';
    const isDisabled = document.getElementById('company').disabled;
    document.getElementById('dividendPasteHint').style.display = hasDividend ? 'inline' : 'none';
    document.getElementById('annuityPasteHint').style.display = showManualAnnuity ? 'inline' : 'none';
    document.getElementById('cashValueColLabel').textContent = isAnnuity ? '现金价值-不含年金（元）' : '现金价值（元）';
    document.getElementById('batchPasteInput').disabled = isDisabled;

    // 数字字段兜底：把 "-"、非法字符串等脏值清成空，避免 <input type="number"> 报解析错误
    const safeNum = (v) => (v === '' || v === null || v === undefined) ? '' : (isFinite(Number(v)) ? v : '');

    let totalCols = 3; // year, cashValue, actions
    if (hasDividend) totalCols += 2; // dividend + distributed
    if (showManualAnnuity) totalCols += 1;
    if (showTransferToUA) totalCols += 1;
    if (hasOtherIncome) totalCols += 1;

    if (cashValues.length === 0) {
      body.innerHTML = '<tr><td colspan="' + totalCols + '" style="color:#9ca3af;padding:20px;">暂无现金价值数据</td></tr>';
    } else {
      const disabledAttr = isDisabled ? ' disabled' : '';
      body.innerHTML = cashValues.map((cv, i) => `
        <tr>
          <td><input type="number" value="${safeNum(cv.year)}" placeholder="${i+1}" min="1" onchange="updateCashValueField(${i},'year',this.value)"${disabledAttr}></td>
          <td><input type="number" value="${safeNum(cv.cashValue)}" placeholder="0" min="0" step="0.01" onchange="updateCashValueField(${i},'cashValue',this.value)"${disabledAttr}></td>
          ${hasDividend ? `<td><input type="number" value="${safeNum(cv.dividend)}" placeholder="0" min="0" step="0.01" onchange="updateCashValueField(${i},'dividend',this.value)"${disabledAttr}></td><td style="text-align:center;"><input type="checkbox" ${cv.distributed ? 'checked' : ''} onchange="updateCashValueField(${i},'distributed',this.checked)"${disabledAttr}></td>` : ''}
          ${showManualAnnuity ? `<td><input type="number" value="${safeNum(cv.annuityAmount)}" placeholder="0" min="0" step="0.01" onchange="updateCashValueField(${i},'annuityAmount',this.value)"${disabledAttr}></td>` : ''}
          ${showTransferToUA ? `<td style="text-align:center;"><input type="checkbox" ${cv.transferToUA ? 'checked' : ''} onchange="updateCashValueField(${i},'transferToUA',this.checked)"${disabledAttr}></td>` : ''}
          ${hasOtherIncome ? `<td><input type="number" value="${safeNum(cv.otherIncome)}" placeholder="0" min="0" step="0.01" onchange="updateCashValueField(${i},'otherIncome',this.value)"${disabledAttr}></td>` : ''}
          <td>${isDisabled ? '' : `<button type="button" class="del-row-btn" onclick="removeCashValueRow(${i})" title="删除">×</button>`}</td>
        </tr>
      `).join('');
    }
  }

  function getCurrentFormPolicy() {
    const id = document.getElementById('policyId').value;
    if (id) {
      return policies.find(p => p.id === id) || null;
    }
    return null;
  }

  function getTempCashValues() {
    try {
      let v = JSON.parse(document.getElementById('cashValueBody').dataset.temp || '[]');
      if (typeof v === 'string') v = JSON.parse(v); // 兼容双重编码残留
      return Array.isArray(v) ? v : [];
    } catch(e) { return []; }
  }

  function setTempCashValues(arr) {
    const el = document.getElementById('cashValueBody');
    el.dataset.temp = (typeof arr === 'string') ? arr : JSON.stringify(arr || []);
  }

  function addCashValueRow() {
    const policy = getCurrentFormPolicy();
    let arr;
    if (policy && policy.cashValues) {
      arr = policy.cashValues;
    } else {
      arr = getTempCashValues();
    }
    arr.push({ year: arr.length + 1, cashValue: '', dividend: '', distributed: false, annuityAmount: '', otherIncome: '', transferToUA: false });
    if (policy && policy.cashValues) {
      policy.cashValues = arr;
    } else {
      setTempCashValues(arr);
    }
    updateCashValueTable();
  }

  function clearAllCashValues() {
    if (!confirm('确定要删除全部现金价值数据吗？')) return;
    const policy = getCurrentFormPolicy();
    if (policy && policy.cashValues) {
      policy.cashValues = [];
    } else {
      setTempCashValues([]);
    }
    updateCashValueTable();
  }

  function removeCashValueRow(index) {
    const policy = getCurrentFormPolicy();
    let arr;
    if (policy && policy.cashValues) {
      arr = policy.cashValues;
    } else {
      arr = getTempCashValues();
    }
    arr.splice(index, 1);
    if (policy && policy.cashValues) {
      policy.cashValues = arr;
    } else {
      setTempCashValues(arr);
    }
    updateCashValueTable();
  }

  function updateCashValueField(index, field, value) {
    const policy = getCurrentFormPolicy();
    let arr;
    if (policy && policy.cashValues) {
      arr = policy.cashValues;
    } else {
      arr = getTempCashValues();
    }
    if (arr[index]) {
      const numericFields = ['year','cashValue','dividend','annuityAmount','otherIncome'];
      if (numericFields.includes(field)) {
        // 只保存合法数字或空；拦截单独的 "-" 等非法值，避免脏数据写入
        arr[index][field] = (value === '' || value === null || value === undefined)
          ? ''
          : (isFinite(Number(value)) ? value : '');
      } else {
        arr[index][field] = value;
      }
    }
    if (policy && policy.cashValues) {
      policy.cashValues = arr;
    } else {
      setTempCashValues(arr);
    }
  }

  function parseBatchPaste() {
    const raw = document.getElementById('batchPasteInput').value.trim();
    if (!raw) return;
    const lines = raw.split(/\r?\n/).filter(l => l.trim());
    const hasDividend = document.getElementById('designType').value === '分红型';
    const manualAnnuity = document.getElementById('manualAnnuity').checked;
    const hasOtherIncomeEl = document.getElementById('hasOtherIncome');
    const hasOtherIncome = hasOtherIncomeEl ? hasOtherIncomeEl.checked : false;
    const policy = getCurrentFormPolicy();
    let arr;
    if (policy && policy.cashValues) {
      arr = policy.cashValues;
    } else {
      arr = getTempCashValues();
    }
    // 清空现有数据
    arr.length = 0;
    lines.forEach(line => {
      const parts = line.split(/[\t\s]+/).filter(p => p);
      if (parts.length >= 2) {
        let annuityAmt = '';
        let otherInc = '';
        if (manualAnnuity || hasOtherIncome) {
          // 列顺序: 年度, 现金价值, [累计红利], [年金金额], [其他收入]
          let offset = 2;
          if (hasDividend) offset++;
          if (manualAnnuity) { annuityAmt = parts.length > offset ? parts[offset].replace(/,/g, '') : ''; offset++; }
          if (hasOtherIncome) { otherInc = parts.length > offset ? parts[offset].replace(/,/g, '') : ''; offset++; }
        }
        const item = { 
          year: parts[0].replace(/,/g, ''), 
          cashValue: parts[1].replace(/,/g, ''), 
          dividend: hasDividend && parts.length >= 3 ? parts[2].replace(/,/g, '') : '',
          annuityAmount: annuityAmt,
          otherIncome: otherInc,
          distributed: false,
          transferToUA: false
        };
        arr.push(item);
      } else if (parts.length === 1 && !isNaN(parts[0])) {
        arr.push({ year: arr.length + 1, cashValue: parts[0].replace(/,/g, ''), dividend: '', annuityAmount: '', otherIncome: '', distributed: false, transferToUA: false });
      }
    });
    if (policy && policy.cashValues) {
      policy.cashValues = arr;
    } else {
      setTempCashValues(arr);
    }
    updateCashValueTable();
  }

  function disableEditMode() {
    const id = document.getElementById('policyId').value;
    const policy = policies.find(p => p.id === id);
    if (policy) {
      document.getElementById('company').value = policy.company || '';
      document.getElementById('productName').value = policy.productName || '';
      document.getElementById('productCategory').value = policy.productCategory || '';
      document.getElementById('designType').value = policy.designType || '';
      document.getElementById('channel').value = policy.channel || '';
      document.getElementById('policyHolder').value = policy.policyHolder || '';
      document.getElementById('insured').value = policy.insured || '';
      document.getElementById('startDate').value = policy.startDate || '';
      document.getElementById('annualPremium').value = policy.annualPremium || '';
      document.getElementById('paymentTerm').value = policy.paymentTerm || '';
      document.getElementById('coverageType').value = policy.coverageType || '终身';
      document.getElementById('coverageValue').value = policy.coverageValue || '';
    document.getElementById('sumAssured').value = policy.sumAssured || '';
    document.getElementById('isSurrendered').checked = policy.isSurrendered || false;
    document.getElementById('surrenderDate').value = policy.surrenderDate || '';
    document.getElementById('surrenderAmount').value = policy.surrenderAmount || '';
    document.getElementById('manualAnnuity').checked = policy.manualAnnuity || false;
    document.getElementById('transferToUA').checked = policy.transferToUA || false;
    document.getElementById('linkedUAPolicy').value = policy.linkedUAPolicyId || '';
    document.getElementById('linkedUAPolicy').style.display = policy.transferToUA ? 'inline-block' : 'none';
    document.getElementById('linkedUAPrompt').style.display = 'none';
    if (policy.transferToUA) {
      populateLinkedUAPolicies(policy.linkedUAPolicyId);
      if (policy.linkedUAPolicyId) {
        document.getElementById('linkedUAPrompt').style.display = 'inline';
        document.getElementById('linkedUAPrompt').textContent = '✅ 已关联万能险：' + (policies.find(p => p.id === policy.linkedUAPolicyId)?.productName || '');
      }
    }
      document.getElementById('hasOtherIncome').checked = policy.hasOtherIncome || false;
      document.getElementById('remarks').value = policy.remarks || '';
      toggleSurrenderFields();
      toggleCoverageInput();
      updateAutoCalc();
    }

    // 万能型：加载UA数据（try/catch保护，确保不会阻断模态框显示）
    if (policy.designType === '万能型') {
      try {
        loadUADataToForm(policy);
        disableUAInputs();
        document.getElementById('uaNonUniversal').style.display = 'none';
        document.getElementById('uaContent').style.display = 'block';
      } catch(e) {
        console.warn('加载万能账户数据时出错:', e);
      }
    }

    setFormEnabled(false);
    document.getElementById('modalTitle').textContent = '保单详情';
    updateCashValueTable();

    const leftBtn = document.getElementById('modalBtnLeft');
    const rightBtn = document.getElementById('modalBtnRight');
    rightBtn.textContent = '编辑';
    rightBtn.onclick = enableEditMode;
    leftBtn.textContent = '关闭';
    leftBtn.onclick = closeModal;
  }

  function openEditModal(id) {
    const policy = policies.find(p => p.id === id);
    if (!policy) { alert('无法找到该保单数据，刷新页面后重试'); return; }

    document.getElementById('modalTitle').textContent = '编辑保单';
    document.getElementById('policyId').value = policy.id;
    document.getElementById('company').value = policy.company || '';
    document.getElementById('productName').value = policy.productName || '';
    document.getElementById('productCategory').value = policy.productCategory || '';
    document.getElementById('designType').value = policy.designType || '';
    document.getElementById('channel').value = policy.channel || '';
    document.getElementById('policyHolder').value = policy.policyHolder || '';
    document.getElementById('insured').value = policy.insured || '';
    document.getElementById('startDate').value = policy.startDate || '';
    document.getElementById('annualPremium').value = policy.annualPremium || '';
    document.getElementById('paymentTerm').value = policy.paymentTerm || '';
    document.getElementById('coverageType').value = policy.coverageType || '终身';
    document.getElementById('coverageValue').value = policy.coverageValue || '';
    document.getElementById('sumAssured').value = policy.sumAssured || '';
    document.getElementById('remarks').value = policy.remarks || '';

    toggleCoverageInput();
    updateAutoCalc();
    document.getElementById('formModal').classList.add('active');
  }

  function toggleCoverageInput() {
    const type = document.getElementById('coverageType').value;
    const group = document.getElementById('coverageValueGroup');
    const label = document.getElementById('coverageValueLabel');

    if (type === '终身') {
      group.style.display = 'none';
    } else {
      group.style.display = 'block';
      label.textContent = type === '保至年龄' ? '保至多少岁' : '保障年限';
    }

    toggleExtraFields();
    autoCalcMaturityDate();
  }

  function closeModal() {
    document.getElementById('formModal').classList.remove('active');
    // 清空批量粘贴区
    document.getElementById('batchPasteInput').value = '';
  }
  function savePolicy() {
    const id = document.getElementById('policyId').value;
    const company = document.getElementById('company').value.trim();
    const productName = document.getElementById('productName').value.trim();
    const productCategory = document.getElementById('productCategory').value;

    if (!company || !productName || !productCategory) {
      alert('请填写必填项：保险公司、产品名称、产品类别');
      return;
    }

    const startDateVal = document.getElementById('startDate').value;
    if (startDateVal) {
      const year = new Date(startDateVal).getFullYear();
      if (year < 1900 || year > 2100) {
        alert('投保日期年份需在 1900-2100 之间');
        return;
      }
    }

    // 编辑时记录旧的关联万能ID，取消勾选后需要清理对应记录
    const oldLinkedUA = id ? (policies.find(p => p.id === id)?.linkedUAPolicyId || '') : '';

    const data = {
      id: id || Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9),
      updatedAt: new Date().toISOString(),
      company,
      productName,
      productCategory,
      designType: document.getElementById('designType').value,
      channel: document.getElementById('channel').value.trim(),
      policyHolder: document.getElementById('policyHolder').value.trim(),
      insured: document.getElementById('insured').value.trim(),
      startDate: document.getElementById('startDate').value,
      annualPremium: document.getElementById('annualPremium').value,
      paymentTerm: document.getElementById('paymentTerm').value,
      coverageType: document.getElementById('coverageType').value,
      coverageValue: document.getElementById('coverageValue').value,
      sumAssured: document.getElementById('sumAssured').value,
      insuredAge: document.getElementById('insuredAge').value,
      maturityAmount: document.getElementById('maturityAmount').value,
      maturityDate: document.getElementById('maturityDate').value,
      annualPayout: document.getElementById('annualPayout').value,
      isMonthlyPayout: document.getElementById('isMonthlyPayout').checked,
      monthlyPayout: document.getElementById('monthlyPayout').value,
      annuityStartType: document.getElementById('annuityStartType').value,
      annuityStartValue: document.getElementById('annuityStartValue').value,
      annuityStartDate: document.getElementById('annuityStartDate').value,
      isSurrendered: document.getElementById('isSurrendered').checked,
      surrenderDate: document.getElementById('surrenderDate').value,
      surrenderAmount: document.getElementById('surrenderAmount').value,
      manualAnnuity: document.getElementById('manualAnnuity').checked,
      transferToUA: document.getElementById('transferToUA').checked,
      linkedUAPolicyId: document.getElementById('transferToUA').checked ? document.getElementById('linkedUAPolicy').value : '',
      hasOtherIncome: document.getElementById('hasOtherIncome').checked,
      excludedFromSummary: document.getElementById('excludedFromSummary').checked,
      cashValues: (function() {
        const cv = getFormCashValues();
        // 取消勾选"年金转入万能"时，清除所有现价行中的转万能标记
        if (!document.getElementById('transferToUA').checked) {
          cv.forEach(c => delete c.transferToUA);
        }
        return cv;
      })(),
      cashValueImported: document.getElementById('cashValueImported').checked,
      remarks: document.getElementById('remarks').value.trim()
    };

    if (id) {
      const index = policies.findIndex(p => p.id === id);
      if (index !== -1) {
        policies[index] = data;
      }
    } else {
      policies.push(data);
    }

    saveData();
    renderStats();
    renderTable();

    // 同步年金转入记录到关联的万能账户
    if (data.transferToUA && data.linkedUAPolicyId) {
      const uaPolicy = policies.find(p => p.id === data.linkedUAPolicyId);
      if (uaPolicy && uaPolicy.universalAccount) {
        const ua = uaPolicy.universalAccount;
        if (!ua.transferRecords) ua.transferRecords = [];
        const cv = data.cashValues || [];
        // Build transfer records from cash values (always replace, even if empty)
        const startDate = new Date(data.startDate);
        const transferred = [];
        const sortedCV = [...cv].filter(c => c.transferToUA && parseFloat(c.annuityAmount) > 0).sort((a,b) => (parseInt(a.year)||0) - (parseInt(b.year)||0));
        const isMonthlyTransfer = data.isMonthlyPayout || false;
        sortedCV.forEach(c => {
          const year = parseInt(c.year) || 0;
          const rawAmt = parseFloat(c.annuityAmount) || 0;
          // 保单年度末的年金，于年度末（第 year 个保单周年日）转入万能
          const transferDate = new Date(startDate);
          transferDate.setFullYear(startDate.getFullYear() + year);
          const amt = isMonthlyTransfer ? rawAmt * 12 : rawAmt;
          transferred.push({
            date: transferDate.toISOString().slice(0,10),
            sourcePolicyId: data.id,
            sourcePolicyName: (data.company || '') + ' ' + (data.productName || ''),
            amount: amt,
            feeRate: 0,
            returnType: 'none',
            returnN: 0,
            returnDate: ''
          });
        });
        // Merge: replace existing records from this source, keep others
        const existing = ua.transferRecords.filter(r => r.sourcePolicyId !== data.id);
        ua.transferRecords = [...existing, ...transferred];
        ua.transferRecords.sort((a,b) => a.date.localeCompare(b.date));
        saveData();
      }
    } else if (oldLinkedUA) {
      // 取消勾选"年金转入万能"，删除对应万能产品中的转入明细
      const uaPolicy = policies.find(p => p.id === oldLinkedUA);
      if (uaPolicy && uaPolicy.universalAccount && uaPolicy.universalAccount.transferRecords) {
        const remaining = uaPolicy.universalAccount.transferRecords.filter(r => r.sourcePolicyId !== data.id);
        uaPolicy.universalAccount.transferRecords = remaining;
        saveData();
      }
    }

    const title = document.getElementById('modalTitle').textContent;
    if (id && title === '编辑保单') {
      disableEditMode();
    } else {
      closeModal();
    }
  }

  // 从年金险侧元数据（transferToUA + linkedUAPolicyId + cashValues）重建所有万能账户的 transferRecords。
  // 用于导入数据后 / 系统启动时自愈，避免关联万能的转入记录丢失。
  function syncAllTransferRecords() {
    if (!Array.isArray(policies)) return;

    const syncedAnnuityIds = new Set(); // 配置了"年金转入万能"的年金险 id（其转入记录以元数据为准重建）
    const computedByUA = {};            // 万能险 id -> 由元数据计算出的转入记录数组

    policies.forEach(p => {
      if (p.universalAccount) return;   // 万能账户本身不转入
      if (!p.transferToUA) return;      // 未配置转入：保留其原有记录，不动
      syncedAnnuityIds.add(p.id);

      if (!p.linkedUAPolicyId) return;  // 配置了转入但没选目标：无可写入的账户
      const uaPolicy = policies.find(u => u.id === p.linkedUAPolicyId);
      if (!uaPolicy || !uaPolicy.universalAccount) return; // 悬空引用：跳过，保留年金侧配置不动

      const ua = uaPolicy.universalAccount;
      if (!Array.isArray(ua.transferRecords)) ua.transferRecords = [];

      const cv = Array.isArray(p.cashValues) ? p.cashValues : [];
      const startDate = new Date(p.startDate);
      if (isNaN(startDate.getTime())) return;
      const sortedCV = [...cv]
        .filter(c => c.transferToUA && parseFloat(c.annuityAmount) > 0)
        .sort((a, b) => (parseInt(a.year) || 0) - (parseInt(b.year) || 0));
      const isMonthlyTransfer = p.isMonthlyPayout || false;
      const transferred = [];
      sortedCV.forEach(c => {
        const year = parseInt(c.year) || 0;
        const rawAmt = parseFloat(c.annuityAmount) || 0;
        const transferDate = new Date(startDate);
        transferDate.setFullYear(startDate.getFullYear() + year);
        const amt = isMonthlyTransfer ? rawAmt * 12 : rawAmt;
        transferred.push({
          date: transferDate.toISOString().slice(0, 10),
          sourcePolicyId: p.id,
          sourcePolicyName: (p.company || '') + ' ' + (p.productName || ''),
          amount: amt,
          feeRate: 0,
          returnType: 'none',
          returnN: 0,
          returnDate: ''
        });
      });
      if (!computedByUA[p.linkedUAPolicyId]) computedByUA[p.linkedUAPolicyId] = [];
      computedByUA[p.linkedUAPolicyId].push(...transferred);
    });

    // 重建每个万能账户的 transferRecords：丢弃来自"已配置转入的年金险"的旧记录（将由元数据重建），
    // 保留其它来源（手动转入等无 sourcePolicyId 或来源未配置转入）的记录，再追加本次计算出的记录。
    policies.forEach(p => {
      if (!p.universalAccount) return;
      const ua = p.universalAccount;
      if (!Array.isArray(ua.transferRecords)) ua.transferRecords = [];
      const kept = ua.transferRecords.filter(r => !r.sourcePolicyId || !syncedAnnuityIds.has(r.sourcePolicyId));
      const appended = computedByUA[p.id] || [];
      ua.transferRecords = [...kept, ...appended];
      ua.transferRecords.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    });

    saveData();
  }

  function openDeleteConfirm(id) {
    deleteTargetId = id;
    document.getElementById('confirmModal').classList.add('active');
  }

  function closeConfirm() {
    deleteTargetId = null;
    document.getElementById('confirmModal').classList.remove('active');
  }

  function confirmDelete() {
    if (deleteTargetId) {
      policies = policies.filter(p => p.id !== deleteTargetId);
      saveData();
      renderStats();
      renderTable();
    }
    closeConfirm();
  }
  function exportData() {
    const dataStr = JSON.stringify(policies, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `保单数据_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data)) {
          if (confirm(`确定要导入 ${data.length} 条保单数据吗？\n（将覆盖现有数据）`)) {
            policies = data;
            syncAllTransferRecords(); // 导入后从年金险元数据重建万能账户转入记录
            saveData();
            renderStats();
            renderTable();
            alert('导入成功！');
          }
        } else {
          alert('文件格式不正确');
        }
      } catch (err) {
        alert('文件解析失败');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  document.getElementById('startDate').addEventListener('change', updateAutoCalc);
  document.getElementById('paymentTerm').addEventListener('input', updateAutoCalc);
