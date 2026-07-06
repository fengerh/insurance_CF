
  // 数据存储
  const STORAGE_KEY = 'policy_manager_data';

  // 简称映射
  const CATEGORY_SHORT = {
    '终身寿险': '终寿', '定期寿险': '定寿', '两全保险': '两全',
    '养老年金保险': '养老', '年金保险': '年金',
    '重大疾病保险': '重疾', '护理保险': '护理', '意外伤害保险': '意外'
  };
  const DESIGN_SHORT = {
    '普通型': '普通', '分红型': '分红', '万能型': '万能'
  };

  let policies = [];
  let showAmounts = true;   // 默认显示金额
  let baseDate = new Date();
  let deleteTargetId = null;
  let sortField = 'startDate';
  let sortDirection = 'desc';

  function init() {
    loadData();
    // 设置基准日期为今天
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    document.getElementById('calcDate').value = todayStr;
    baseDate = new Date(todayStr + 'T00:00:00');
    // 监听日期变化
    document.getElementById('calcDate').addEventListener('change', function(e) {
      const val = e.target.value;
      if (val) {
        baseDate = new Date(val + 'T00:00:00');
      } else {
        baseDate = new Date();
        document.getElementById('calcDate').value = new Date().toISOString().slice(0,10);
      }
      renderStats();
      renderTable();
      if (currentView === 'calendar') {
        calendarYear = baseDate.getFullYear();
        calendarMonth = baseDate.getMonth();
        renderCalendar();
      }
    });
    renderStats();
    renderTable();
    updateFilterCounts();

    document.getElementById('gotoTodayBtn').addEventListener('click', function() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      const dateInput = document.getElementById('calcDate');
      dateInput.value = todayStr;
      dateInput.dispatchEvent(new Event('change'));
    });
    document.getElementById('productCategory').addEventListener('change', toggleExtraFields);
    document.getElementById('coverageType').addEventListener('change', toggleExtraFields);
    document.getElementById('startDate').addEventListener('change', autoCalcMaturityDate);
    document.getElementById('coverageType').addEventListener('change', function() {
      toggleCoverageInput();
      autoCalcMaturityDate();
    });
    document.getElementById('coverageValue').addEventListener('input', autoCalcMaturityDate);
    document.getElementById('insuredAge').addEventListener('input', autoCalcMaturityDate);
    toggleExtraFields();

    document.getElementById('startDate').addEventListener('change', autoCalcAnnuityStartDate);
    document.getElementById('annuityStartType').addEventListener('change', function() {
      updateAnnuityStartLabel();
      autoCalcAnnuityStartDate();
    });
    document.getElementById('annuityStartValue').addEventListener('input', autoCalcAnnuityStartDate);
    document.getElementById('insuredAge').addEventListener('input', autoCalcAnnuityStartDate);
    // 手动输入年金变化时刷新转入万能提示
    document.getElementById('manualAnnuity').addEventListener('change', function() {
      if (document.getElementById('transferToUA').checked && !this.checked) {
        document.getElementById('linkedUAPrompt').style.display = 'inline';
        document.getElementById('linkedUAPrompt').textContent = '⚠️ 请先勾选「手动输入年金」';
      }
    });
    // 初始化视图
    switchView('list');
    // 初始化日历月份
    const base = baseDate || new Date();
    calendarYear = base.getFullYear();
    calendarMonth = base.getMonth();
    
    // ----- 长按连续触发逻辑 -----
    function setupLongPress(element, direction) {
      let timer = null;
      const startPress = (e) => {
        e.preventDefault();
        changeCalendarMonth(direction);
        timer = setInterval(() => {
          changeCalendarMonth(direction);
        }, 300);
      };
      const stopPress = () => {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      };
      element.addEventListener('mousedown', startPress);
      element.addEventListener('mouseup', stopPress);
      element.addEventListener('mouseleave', stopPress);
      element.addEventListener('touchstart', startPress);
      element.addEventListener('touchend', stopPress);
      element.addEventListener('touchcancel', stopPress);
    }

    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    if (prevBtn) setupLongPress(prevBtn, -1);
    if (nextBtn) setupLongPress(nextBtn, 1);
  }

  // 切换金额显示状态
  function toggleAmounts() {
    showAmounts = !showAmounts;
    const btn = document.getElementById('toggleAmountBtn');
    btn.textContent = showAmounts ? '👁️显示金额' : '🙈隐藏金额';
    renderStats();
    renderTable();
  }
  // ========== 日历视图相关 ==========
  let currentView = 'list';
  let calendarYear = 0, calendarMonth = 0;
  let calendarMode = 'all'; // 'all' | 'payment' | 'payout'

  function setCalendarMode(mode) {
    calendarMode = mode;
    document.getElementById('modeAllBtn').classList.toggle('active', mode === 'all');
    document.getElementById('modePaymentBtn').classList.toggle('active', mode === 'payment');
    document.getElementById('modePayoutBtn').classList.toggle('active', mode === 'payout');
    renderCalendar();
  }

  function switchView(view) {
    currentView = view;
    document.getElementById('listViewBtn').classList.toggle('active', view === 'list');
    document.getElementById('calendarViewBtn').classList.toggle('active', view === 'calendar');
    document.querySelector('.table-wrapper').style.display = view === 'list' ? 'block' : 'none';
    document.getElementById('calendarView').style.display = view === 'calendar' ? 'block' : 'none';
    // 列表视图显示新增按钮，日历视图显示模式切换
    document.getElementById('listAddBtn').style.display = view === 'list' ? 'inline-flex' : 'none';
    document.getElementById('calendarModeToggle').style.display = view === 'calendar' ? 'inline-flex' : 'none';
    if (view === 'calendar') {
      const base = baseDate || new Date();
      calendarYear = base.getFullYear();
      calendarMonth = base.getMonth();
      renderCalendar();
    }
  }

  function changeCalendarMonth(delta) {
    calendarMonth += delta;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    else if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderCalendar();
  }

  function generateEvents(startDate, endDate) {
    const filtered = getFilteredPolicies().filter(p => !p.excludedFromSummary);
    const events = [];

    // calendarMode: 'all' | 'payment' | 'payout'
    const includePayment = (calendarMode === 'all' || calendarMode === 'payment');
    const includePayout = (calendarMode === 'all' || calendarMode === 'payout');

    filtered.forEach(p => {
      const start = new Date(p.startDate);
      const company = String(p.company || '未知名');
      if (isNaN(start.getTime())) return;
      const annualPremium = parseFloat(p.annualPremium) || 0;
      const paymentTerm = parseInt(p.paymentTerm) || 0;
      const maturityDate = p.maturityDate ? new Date(p.maturityDate) : null;
      const maturityAmount = parseFloat(p.maturityAmount) || 0;
      const policyName = p.productName || '未命名';
      const policyId = p.id;

      // 缴费事件（缴费日 + 宽限期）
      if (includePayment && paymentTerm > 0) {
        for (let i = 0; i < paymentTerm; i++) {
          const dueDate = new Date(start);
          dueDate.setFullYear(start.getFullYear() + i);
          dueDate.setMonth(start.getMonth(), start.getDate());
          if (dueDate >= startDate && dueDate <= endDate) {
            events.push({
              date: new Date(dueDate),
              type: '缴费日',
              label: `📌${company} ${policyName} 缴费 ${i+1}/${paymentTerm}期`,
              amount: annualPremium,
              policyId
            });
          }
          const graceDate = new Date(dueDate);
          graceDate.setDate(graceDate.getDate() + 60);
          if (graceDate >= startDate && graceDate <= endDate) {
            events.push({
              date: new Date(graceDate),
              type: '宽限期',
              label: `⏳${company} ${policyName} 宽限期截止 ${i+1}/${paymentTerm}期`,
              amount: annualPremium,
              policyId
            });
          }
        }
      }

      // 满期日（属于领取类）
      if (includePayout && p.maturityDate) {
        const maturityDate = new Date(p.maturityDate);
        if (!isNaN(maturityDate.getTime())) {
          if (maturityDate >= startDate && maturityDate <= endDate) {
            events.push({
              date: new Date(maturityDate),
              type: '满期日',
              label: `☑️${company} ${policyName} 满期`,
              amount: maturityAmount,
              policyId
            });
          }
        } else {
          console.warn('保单', p.id, '无效的满期日:', p.maturityDate);
        }
      }

      // 年金领取（属于领取类）
      if (includePayout) {
        const isAnnuity = p.productCategory === '年金保险' || p.productCategory === '养老年金保险';
        if (isAnnuity) {
          const annuityStartDate = p.annuityStartDate ? new Date(p.annuityStartDate) : null;
          if (annuityStartDate && !isNaN(annuityStartDate.getTime())) {
            const isMonthly = p.isMonthlyPayout || false;
            const manualAnnuity = p.manualAnnuity || false;

            const maturityDate = p.maturityDate ? new Date(p.maturityDate) : null;
            const hasMaturity = maturityDate && !isNaN(maturityDate.getTime());

            if (manualAnnuity) {
              // 手动输入年金：从现金价值表查询 annuityAmount（月领时存的是月度金额，年领时存的是年度金额）
              const cashValues = p.cashValues || [];
              const sortedCV = [...cashValues].sort((a, b) => (parseInt(a.year) || 0) - (parseInt(b.year) || 0));
              if (sortedCV.length > 0) {
                let current = new Date(annuityStartDate);
                while (current <= endDate && (!hasMaturity || current <= maturityDate)) {
                  // 计算当前日期对应的保单年度
                  const elapsedYears = (current - start) / (365.25 * 24 * 3600 * 1000);
                  const policyYear = Math.ceil(elapsedYears);

                  // 在现价表中查找该年度的年金金额
                  const cvRow = sortedCV.find(r => parseInt(r.year) === policyYear);
                  const amount = cvRow ? (parseFloat(cvRow.annuityAmount) || 0) : 0;

                  if (amount > 0 && current >= startDate) {
                    events.push({
                      date: new Date(current),
                      type: '年金领取',
                      label: `💰${company} ${policyName} ${isMonthly ? '月领' : '年领'}`,
                      amount: amount,
                      policyId
                    });
                  }

                  if (isMonthly) {
                    current.setMonth(current.getMonth() + 1);
                  } else {
                    current.setFullYear(current.getFullYear() + 1);
                  }
                }
              }
            } else {
              // 非手动：使用基本信息的固定金额
              const annualPayout = parseFloat(p.annualPayout) || 0;
              const monthlyPayout = parseFloat(p.monthlyPayout) || 0;
              const amount = isMonthly ? monthlyPayout : annualPayout;

              let current = new Date(annuityStartDate);
              while (current <= endDate && (!hasMaturity || current <= maturityDate)) {
                if (current >= startDate) {
                  events.push({
                    date: new Date(current),
                    type: '年金领取',
                    label: `💰${company} ${policyName} ${isMonthly ? '月领' : '年领'}`,
                    amount: amount,
                    policyId
                  });
                }
                if (isMonthly) {
                  current.setMonth(current.getMonth() + 1);
                } else {
                  current.setFullYear(current.getFullYear() + 1);
                }
              }
            }
          }
        }
      }

      // 退保
      if (p.isSurrendered && p.surrenderDate) {
        const surDate = new Date(p.surrenderDate);
        if (!isNaN(surDate.getTime()) && surDate >= startDate && surDate <= endDate) {
          events.push({
            date: new Date(surDate),
            type: '退保',
            label: `🏛️${company} ${policyName} 退保`,
            amount: parseFloat(p.surrenderAmount) || 0,
            policyId
          });
        }
      }
    });

    return events;
  }

  function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const title = document.getElementById('calendarTitle');

    let year = calendarYear;
    let month = calendarMonth;

    const months = [];
    for (let i = 0; i < 2; i++) {
      let m = month + i;
      let y = year;
      if (m > 11) { m -= 12; y++; }
      months.push({ year: y, month: m });
    }

    const monthNames = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
    title.textContent = `${monthNames[months[0].month]} ${months[0].year}  —  ${monthNames[months[1].month]} ${months[1].year}`;

    const startDate = new Date(months[0].year, months[0].month, 1);
    const endDate = new Date(months[1].year, months[1].month + 1, 0);
    const allEvents = generateEvents(startDate, endDate);

    grid.innerHTML = '';
    months.forEach((m, idx) => {
      const monthDiv = document.createElement('div');
      monthDiv.style.flex = '1';
      monthDiv.style.width = '100%';

      const monthTitle = document.createElement('div');
      monthTitle.style.textAlign = 'center';
      monthTitle.style.fontWeight = '600';
      monthTitle.style.marginBottom = '4px';
      monthTitle.textContent = `${monthNames[m.month]} ${m.year}`;
      monthDiv.appendChild(monthTitle);

      // 当月现金流合计
      const monthStart = new Date(m.year, m.month, 1);
      const monthEnd = new Date(m.year, m.month + 1, 0, 23, 59, 59);
      const monthEvents = allEvents.filter(e => e.date >= monthStart && e.date <= monthEnd);
      const summary = {};
      monthEvents.forEach(ev => {
        if (!summary[ev.type]) summary[ev.type] = { count: 0, total: 0 };
        summary[ev.type].count++;
        summary[ev.type].total += (ev.amount || 0);
      });
      // 缴费：只统计缴费日，不含宽限期
      if (summary['缴费日']) {
        summary['缴费'] = summary['缴费日'];
        delete summary['缴费日'];
      }
      delete summary['宽限期'];
      const summaryParts = [];
      const typeConfig = {
        '年金领取': { color: '#065f46', bg: '#ecfdf5' },
        '满期日': { color: '#065f46', bg: '#ecfdf5', label: '满期' },
        '退保': { color: '#dc2626', bg: '#fef2f2' },
        '缴费': { color: '#1e40af', bg: '#eff6ff' }
      };
      for (const [type, cfg] of Object.entries(typeConfig)) {
        if (summary[type] && summary[type].count > 0) {
          const label = cfg.label || type;
          const amtStr = showAmounts ? formatMoney(summary[type].total) : '***';
          summaryParts.push(`<span style="background:${cfg.bg};color:${cfg.color};padding:1px 6px;border-radius:3px;font-size:11px;margin:0 2px;">${label} ${summary[type].count}份/¥${amtStr}</span>`);
        }
      }
      // 月底生存总利益汇总
      const benefitModeEl = document.getElementById('colBenefitMode');
      const benefitMode = benefitModeEl ? benefitModeEl.value : 'total';
      const modeLabels = { total:'保单总利益', cashValue:'现金价值', annuity:'累计年金', dividend:'累计红利', maturity:'满期金', otherIncome:'保单其他收入', totalWithOther:'总利益（含）' };
      const filteredPolicies = getFilteredPolicies().filter(p => !p.excludedFromSummary);
      let benefitTotal = 0;
      filteredPolicies.forEach(p => {
        const comp = calcBenefitComponentsAtDate(p, monthEnd);
        if (!comp) return;
        switch (benefitMode) {
          case 'cashValue': benefitTotal += comp.cashValue; break;
          case 'dividend': benefitTotal += comp.dividend; break;
          case 'annuity': benefitTotal += comp.cumAnnuity; break;
          case 'maturity': benefitTotal += comp.maturityAmt; break;
          case 'otherIncome': benefitTotal += comp.cumOtherIncome; break;
          case 'totalWithOther': benefitTotal += Math.round((comp.isMatured ? comp.maturityAmt : comp.cashValue) + comp.dividend + comp.cumAnnuity + comp.cumOtherIncome); break;
          default: benefitTotal += Math.round((comp.isMatured ? comp.maturityAmt : comp.cashValue) + comp.dividend + comp.cumAnnuity);
        }
      });
      const benefitLabel = modeLabels[benefitMode] || '总利益（不含其他）';
      const benefitAmtStr = showAmounts ? formatMoney(benefitTotal) : '***';
      summaryParts.push(`<span style="background:#f5f3ff;color:#6d28d9;padding:1px 6px;border-radius:3px;font-size:11px;margin:0 2px;">月底 ${benefitLabel} ¥${benefitAmtStr}</span>`);
      {
        const summaryDiv = document.createElement('div');
        summaryDiv.style.textAlign = 'center';
        summaryDiv.style.marginBottom = '8px';
        summaryDiv.style.fontSize = '12px';
        summaryDiv.innerHTML = summaryParts.join('');
        monthDiv.appendChild(summaryDiv);
      }

      const weekDays = ['日','一','二','三','四','五','六'];
      const headerRow = document.createElement('div');
      headerRow.style.display = 'grid';
      headerRow.style.gridTemplateColumns = 'repeat(7, 1fr)';
      headerRow.style.textAlign = 'center';
      headerRow.style.fontSize = '12px';
      headerRow.style.color = '#6b7280';
      headerRow.style.marginBottom = '4px';
      weekDays.forEach(d => {
        const cell = document.createElement('div');
        cell.textContent = d;
        headerRow.appendChild(cell);
      });
      monthDiv.appendChild(headerRow);

      const gridContainer = document.createElement('div');
      gridContainer.style.display = 'grid';
      gridContainer.style.gridTemplateColumns = 'repeat(7, 1fr)';
      gridContainer.style.gap = '2px';
      gridContainer.style.fontSize = '13px';

      const firstDay = new Date(m.year, m.month, 1);
      const lastDay = new Date(m.year, m.month + 1, 0);
      const startDayOfWeek = firstDay.getDay();
      const daysInMonth = lastDay.getDate();

      // 预计算每周是否有事件
      const weekHasEvents = {};
      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(m.year, m.month, day);
        const hasEv = allEvents.some(e => {
          const d = e.date;
          return d.getFullYear() === dateObj.getFullYear() && d.getMonth() === dateObj.getMonth() && d.getDate() === dateObj.getDate();
        });
        if (hasEv) {
          const weekIdx = Math.floor((day + startDayOfWeek - 1) / 7);
          weekHasEvents[weekIdx] = true;
        }
      }

      for (let i = 0; i < startDayOfWeek; i++) {
        const cell = document.createElement('div');
        const wIdx = Math.floor(i / 7);
        cell.style.minHeight = weekHasEvents[wIdx] ? '70px' : '35px';
        cell.style.background = '#f9fafb';
        cell.style.borderRadius = '4px';
        gridContainer.appendChild(cell);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(m.year, m.month, day);
        const weekIdx = Math.floor((day + startDayOfWeek - 1) / 7);
        const cell = document.createElement('div');
        cell.style.minHeight = weekHasEvents[weekIdx] ? '70px' : '35px';
        cell.style.border = '1px solid #e5e7eb';
        cell.style.borderRadius = '4px';
        cell.style.padding = '2px 4px';
        cell.style.overflow = 'visible';
        cell.style.display = 'flex';
        cell.style.flexDirection = 'column';

        const dayNum = document.createElement('div');
        dayNum.style.fontWeight = '500';
        dayNum.style.fontSize = '14px';
        dayNum.textContent = day;
        cell.appendChild(dayNum);

        const dayEvents = allEvents.filter(e => {
          const d = e.date;
          return d.getFullYear() === dateObj.getFullYear() &&
                d.getMonth() === dateObj.getMonth() &&
                d.getDate() === dateObj.getDate();
        });

        if (dayEvents.length > 0) {
          const eventsList = document.createElement('div');
          eventsList.style.fontSize = '10px';
          eventsList.style.marginTop = '2px';
          eventsList.style.display = 'flex';
          eventsList.style.flexDirection = 'column';
          eventsList.style.gap = '1px';

          let hasPayment = false;
          let hasPayout = false;

          dayEvents.forEach(ev => {
            const eventItem = document.createElement('div');
            eventItem.style.whiteSpace = 'normal';
            eventItem.style.wordBreak = 'break-word';
            eventItem.style.overflowWrap = 'break-word';
            eventItem.style.overflow = 'visible';
            eventItem.style.padding = '1px 4px';
            eventItem.style.borderRadius = '3px';

            // 缴费类事件：蓝色系
            if (ev.type === '缴费日' || ev.type === '宽限期') {
              eventItem.style.background = '#eff6ff';
              eventItem.style.color = '#1e40af';
              hasPayment = true;
            }
            // 领取类事件：绿色系
            else if (ev.type === '年金领取' || ev.type === '满期日') {
              eventItem.style.background = '#ecfdf5';
              eventItem.style.color = '#065f46';
              hasPayout = true;
            }
            // 退保事件：红色系
            else if (ev.type === '退保') {
              eventItem.style.background = '#fef2f2';
              eventItem.style.color = '#dc2626';
            }
            else {
              eventItem.style.background = '#f3f4f6';
              eventItem.style.color = '#4b5563';
            }

            let label = ev.label;
            if (ev.amount && showAmounts) {
              label += ` ¥${formatMoney(ev.amount)}`;
            } else if (ev.amount && !showAmounts) {
              label += ` ¥***`;
            }
            eventItem.textContent = label;
            eventsList.appendChild(eventItem);
          });
          cell.appendChild(eventsList);

          // 单元格底色
          const hasSurrender = dayEvents.some(ev => ev.type === '退保');
          if (hasPayment && hasPayout) {
            cell.style.background = '#f5f3ff';
          } else if (hasPayment) {
            cell.style.background = '#f0f9ff';
          } else if (hasPayout) {
            cell.style.background = '#ecfdf5';
          }
          if (hasSurrender) {
            cell.style.background = '#fef2f2';
          }
        }

        const today = baseDate;
        if (dateObj.getFullYear() === today.getFullYear() &&
            dateObj.getMonth() === today.getMonth() &&
            dateObj.getDate() === today.getDate()) {
          cell.style.border = '2px solid #4f46e5';
        }

        gridContainer.appendChild(cell);
      }

      monthDiv.appendChild(gridContainer);
      grid.appendChild(monthDiv);
    });
  }
  // 金额显示辅助函数
  function formatMoneyDisplay(value) {
    if (!showAmounts) return '¥***';
    return '¥' + formatMoney(value);
  }
  function updateFilterCounts() {
    // 各项计数基于"排除自身外"的其他筛选条件动态计算，实现联动
    const catBase = getFilteredExcluding('category');
    const designBase = getFilteredExcluding('designType');
    const statusBase = getFilteredExcluding('status');
    const channelBase = getFilteredExcluding('channel');

    // 各个下拉的"全部"显示各自子集的总数（而非全筛选后的总数）
    const catTotal = catBase.length;
    const designTotal = designBase.length;
    const statusTotal = statusBase.length;
    const channelTotal = channelBase.length;

    // 产品类别
    const catCounts = {};
    catBase.forEach(p => { const cat = p.productCategory || ''; catCounts[cat] = (catCounts[cat] || 0) + 1; });
    const catSelect = document.getElementById('filterCategory');
    for (let opt of catSelect.options) {
      opt.textContent = opt.value === '' ? `全部 (${catTotal})` : `${opt.value} (${catCounts[opt.value] || 0})`;
    }

    // 设计类型
    const designCounts = {};
    designBase.forEach(p => { const d = p.designType || ''; designCounts[d] = (designCounts[d] || 0) + 1; });
    const designSelect = document.getElementById('filterDesignType');
    for (let opt of designSelect.options) {
      opt.textContent = opt.value === '' ? `全部 (${designTotal})` : `${opt.value} (${designCounts[opt.value] || 0})`;
    }

    // 保单状态
    const statusCounts = { '交费中': 0, '缴清': 0, '年金领取': 0, '满期': 0, '退保': 0 };
    statusBase.forEach(p => { calcPolicyStatus(p, baseDate).forEach(s => { statusCounts[s] = (statusCounts[s] || 0) + 1; }); });
    const statusSelect = document.getElementById('filterStatus');
    for (let opt of statusSelect.options) {
      opt.textContent = opt.value === '' ? `全部 (${statusTotal})` : `${opt.value} (${statusCounts[opt.value] || 0})`;
    }

    // 渠道
    const channelCounts = {};
    channelBase.forEach(p => { const ch = (p.channel || '').trim(); if (ch) channelCounts[ch] = (channelCounts[ch] || 0) + 1; });
    const channelSelect = document.getElementById('filterChannel');
    const savedChannel = channelSelect.value;
    channelSelect.options[0].textContent = `全部 (${channelTotal})`;
    while (channelSelect.options.length > 1) channelSelect.remove(1);
    const sortedChannels = Object.entries(channelCounts).sort((a, b) => a[0].localeCompare(b[0], 'zh-CN'));
    for (const [ch, count] of sortedChannels) {
      const option = document.createElement('option');
      option.value = ch;
      option.textContent = `${ch} (${count})`;
      channelSelect.appendChild(option);
    }
    channelSelect.value = savedChannel;
  }
  function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        policies = JSON.parse(saved);
        policies = policies.map(p => {
          if (p.policyType && !p.productCategory) {
            const mapping = {
              '增额终身寿': { category: '终身寿险', design: '普通型' },
              '分红增额终身寿': { category: '终身寿险', design: '分红型' },
              '终身年金': { category: '年金保险', design: '普通型' },
              '年金两全': { category: '年金保险', design: '普通型' },
              '养老年金': { category: '养老年金保险', design: '普通型' },
              '重疾': { category: '重大疾病保险', design: '普通型' },
              '定期寿险': { category: '定期寿险', design: '普通型' },
            };
            const mapped = mapping[p.policyType];
            if (mapped) {
              p.productCategory = mapped.category;
              p.designType = mapped.design;
            } else {
              p.productCategory = p.policyType;
            }
            delete p.policyType;
          }
          return p;
        });
      } catch (e) {
        policies = [];
      }
    }
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
  }
  function calcPaidYears(startDate, paymentTerm, baseDate) {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const now = baseDate || new Date();
    if (isNaN(start.getTime())) return 0;
    let paid = 1;
    const nextDue = new Date(start);
    nextDue.setFullYear(nextDue.getFullYear() + 1);
    nextDue.setDate(nextDue.getDate() + 60);
    while (nextDue <= now) {
      paid++;
      nextDue.setFullYear(nextDue.getFullYear() + 1);
    }
    if (paymentTerm) {
      const term = parseInt(paymentTerm);
      if (!isNaN(term)) {
        return Math.min(paid, term);
      }
    }
    return paid;
  }

  function calcPaymentStatus(startDate, paymentTerm, baseDate) {
    if (!startDate || !paymentTerm) return '待确认';
    const paid = calcPaidYears(startDate, paymentTerm, baseDate);
    const term = parseInt(paymentTerm);
    if (isNaN(term)) return '待确认';
    return paid >= term ? '缴清' : '交费中';
  }

  function calcPolicyStatus(policy, baseDate) {
    // 退保优先：已退保 → 仅显示退保
    if (policy.isSurrendered && policy.surrenderDate) {
      const surDate = new Date(policy.surrenderDate);
      if (!isNaN(surDate.getTime()) && baseDate >= surDate) {
        return ['退保'];
      }
    }
    // 满期次之：已满期 → 仅显示满期
    if (policy.maturityDate) {
      const maturity = new Date(policy.maturityDate);
      if (!isNaN(maturity.getTime()) && baseDate >= maturity) {
        return ['满期'];
      }
    }
    // 否则正常聚合多重状态
    const statuses = [];
    const payStatus = calcPaymentStatus(policy.startDate, policy.paymentTerm, baseDate);
    if (payStatus !== '待确认') statuses.push(payStatus);
    const isAnnuity = policy.productCategory === '年金保险' || policy.productCategory === '养老年金保险';
    if (isAnnuity && policy.annuityStartDate) {
      const annuityStart = new Date(policy.annuityStartDate);
      if (!isNaN(annuityStart.getTime()) && baseDate >= annuityStart) {
        statuses.push('年金领取');
      }
    }
    // 万能险：计算基准日期的退保手续费率，>0时加"费x"
    if (policy.designType === '万能型' && policy.universalAccount) {
      const ua = policy.universalAccount;
      const feeRatesStr = ua.withdrawFeeRates || '';
      if (feeRatesStr) {
        const feeRates = feeRatesStr.split(',').map(s => parseInt(s.trim()) || 0);
        const startDate = policy.startDate ? new Date(policy.startDate) : null;
        if (startDate && !isNaN(startDate.getTime())) {
          const policyYear = Math.ceil((baseDate - startDate) / (365.25 * 24 * 3600 * 1000));
          const idx = Math.max(0, policyYear - 1);
          const feeRate = idx < feeRates.length ? feeRates[idx] : 0;
          if (feeRate > 0) {
            statuses.push('费' + feeRate);
          }
        }
      }
    }
    if (statuses.length === 0) statuses.push('待确认');
    return statuses;
  }
  function renderStatusTags(policy, baseDate) {
    const statuses = calcPolicyStatus(policy, baseDate);
    const shortMap = { '交费中': '交', '缴清': '清', '年金领取': '金', '满期': '满', '退保': '退' };
    return statuses.map(s => {
      // "费x" 特殊处理：红色标签
      if (s.startsWith('费')) {
        return `<span class="tag" style="background:#fef3c7;color:#92400e;margin:0 1px;" title="退保手续费${s.replace('费','')}%">${s}</span>`;
      }
      return `<span class="tag tag-status-${s}" style="margin:0 1px;" title="${s}">${shortMap[s] || s}</span>`;
    }).join('');
  }
  function renderStats(filteredList) {
    let data = filteredList !== undefined ? filteredList : policies;
    data = data.filter(p => !p.excludedFromSummary);
    const today = baseDate;
    today.setHours(0, 0, 0, 0);
    const activeData = data.filter(p => isPolicyActive(p, today));

    const totalAll = data.length;
    const total = activeData.length;
    let paying = 0, paidOff = 0, annuityCount = 0, matureCount = 0;
    activeData.forEach(p => {
      const statuses = calcPolicyStatus(p, today);
      if (statuses.includes('交费中')) paying++;
      if (statuses.includes('缴清')) paidOff++;
      if (statuses.includes('年金领取')) annuityCount++;
      if (statuses.includes('满期')) matureCount++;
    });
    const totalPaidPremium = activeData.reduce((sum, p) => {
      const paidYears = calcPaidYears(p.startDate, p.paymentTerm, today);
      return sum + (parseFloat(p.annualPremium) || 0) * paidYears;
    }, 0);

    const currentYear = today.getFullYear();
    let paidCount = 0, paidAmount = 0;
    let unpaidCount = 0, unpaidAmount = 0;
    let totalRemainingUnpaid = 0;

    activeData.forEach(p => {
      const start = new Date(p.startDate);
      if (isNaN(start.getTime())) return;
      const annual = parseFloat(p.annualPremium) || 0;
      const term = parseInt(p.paymentTerm) || 0;
      if (term <= 0) return;

      const startYear = start.getFullYear();
      const month = start.getMonth();
      const day = start.getDate();

      if (currentYear < startYear || currentYear >= startYear + term) {
        return;
      }

      const anniversary = new Date(currentYear, month, day);
      const deadline = new Date(anniversary);
      deadline.setDate(deadline.getDate() + 60);

      if (today >= deadline) {
        paidCount++;
        paidAmount += annual;
        const remainingYears = (startYear + term) - (currentYear + 1);
        if (remainingYears > 0) {
          totalRemainingUnpaid += remainingYears * annual;
        }
      } else {
        unpaidCount++;
        unpaidAmount += annual;
        const remainingYears = (startYear + term) - currentYear;
        if (remainingYears > 0) {
          totalRemainingUnpaid += remainingYears * annual;
        }
      }
    });

    document.getElementById('stats').innerHTML = `
      <div class="stats-row-5">
        <div class="stat-card">
          <div class="stat-label">保单总数</div>
          <div class="stat-value" >${totalAll} 份 / <span style="color:#059669;">有效 ${total}</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">保单状态分布</div>
          <div class="stat-value" style="font-size:14px;">
            <span style="color:#059669;">缴清${paidOff}</span>
            / <span style="color:#d97706;">交费中${paying}</span>
            ${annuityCount > 0 ? ` / <span style="color:#0f766e;">领年金${annuityCount}</span>` : ''}
            ${matureCount > 0 ? ` / <span style="color:#6b21a8;">满期${matureCount}</span>` : ''}
          </div>
        </div>
        <div class="stat-card" style="border-left: 3px solid #d97706;">
          <div class="stat-label">📅 累计总剩余未交</div>
          <div class="stat-value" style="color:#d97706;">${formatMoneyDisplay(totalRemainingUnpaid)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">累计已交保费</div>
          <div class="stat-value premium">${formatMoneyDisplay(totalPaidPremium)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">💹 ${(() => {
            const mode = document.getElementById('colBenefitMode').value;
            const labels = { total:'保单总利益', cashValue:'现金价值', annuity:'累计年金', dividend:'累计红利', maturity:'满期金', otherIncome:'保单其他收入', totalWithOther:'总利益（含）' };
            return labels[mode] || '总利益（不含其他）';
          })()} 汇总</div>
          <div class="stat-value">${(() => {
            const benefitMode = document.getElementById('colBenefitMode').value;
            const benefitData = data;
            let benefitTotal = 0;
            benefitData.forEach(p => {
              const comp = calcBenefitComponentsAtDate(p, today);
              if (!comp) return;
              switch (benefitMode) {
                case 'cashValue': benefitTotal += comp.cashValue; break;
                case 'dividend': benefitTotal += comp.dividend; break;
                case 'annuity': benefitTotal += comp.cumAnnuity; break;
                case 'maturity': benefitTotal += comp.maturityAmt; break;
                case 'otherIncome': benefitTotal += comp.cumOtherIncome; break;
                case 'totalWithOther': benefitTotal += Math.round((comp.isMatured ? comp.maturityAmt : comp.cashValue) + comp.dividend + comp.cumAnnuity + comp.cumOtherIncome); break;
                default: benefitTotal += Math.round((comp.isMatured ? comp.maturityAmt : comp.cashValue) + comp.dividend + comp.cumAnnuity);
              }
            });
            return formatMoneyDisplay(benefitTotal);
          })()}</div>
        </div>
      </div>
      <div class="stats-row-5">
        <div class="stat-card" style="border-left: 3px solid #059669;">
          <div class="stat-label">✅ 当年已交保费</div>
          <div class="stat-value" style="color:#059669;">${paidCount} 份</div>
        </div>
        <div class="stat-card" style="border-left: 3px solid #dc2626;">
          <div class="stat-label">⏳ 当年未交保费</div>
          <div class="stat-value" style="color:#dc2626;">${unpaidCount} 份</div>
        </div>
        <div class="stat-card" style="border-left: 3px solid #dc2626;">
          <div class="stat-label">⏳ 当年未交金额</div>
          <div class="stat-value" style="color:#dc2626;">${formatMoneyDisplay(unpaidAmount)}</div>
        </div>
        <div class="stat-card" style="border-left: 3px solid #059669;">
          <div class="stat-label">✅ 当年累计已交</div>
          <div class="stat-value" style="color:#059669;">${formatMoneyDisplay(paidAmount)}</div>
        </div>
        <div class="stat-card"></div>
      </div>
    `;
  }

  function isPolicyActive(policy, baseDate) {
    if (!policy.maturityDate) return true;
    const maturity = new Date(policy.maturityDate);
    if (isNaN(maturity.getTime())) return true;
    return baseDate <= maturity;
  }

  function formatMoney(num) {
    if (!num) return '0';
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  function getFilteredExcluding(excludeField) {
    const category = (excludeField === 'category') ? '' : document.getElementById('filterCategory').value;
    const designType = (excludeField === 'designType') ? '' : document.getElementById('filterDesignType').value;
    const status = (excludeField === 'status') ? '' : document.getElementById('filterStatus').value;
    const channel = (excludeField === 'channel') ? '' : document.getElementById('filterChannel').value;
    const search = (excludeField === 'search') ? '' : document.getElementById('filterSearch').value.toLowerCase();

    return policies.filter(p => {
      if (category && p.productCategory !== category) return false;
      if (designType && p.designType !== designType) return false;
      if (status) {
        const statuses = calcPolicyStatus(p, baseDate);
        if (!statuses.includes(status)) return false;
      }
      if (channel && p.channel !== channel) return false;
      if (search) {
        const company = (p.company || '').toLowerCase();
        const product = (p.productName || '').toLowerCase();
        if (!company.includes(search) && !product.includes(search)) return false;
      }
      return true;
    });
  }

  function getFilteredPolicies() {
    return getFilteredExcluding();
  }
  function interpolateValue(sorted, elapsedYears, field) {
    const firstYear = parseInt(sorted[0].year) || 0;
    if (elapsedYears <= firstYear) return parseFloat(sorted[0][field]) || 0;
    const lastYear = parseInt(sorted[sorted.length - 1].year) || 0;
    if (elapsedYears >= lastYear) return parseFloat(sorted[sorted.length - 1][field]) || 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      const y1 = parseInt(sorted[i].year) || 0;
      const y2 = parseInt(sorted[i + 1].year) || 0;
      if (elapsedYears >= y1 && elapsedYears <= y2) {
        const v1 = parseFloat(sorted[i][field]) || 0;
        const v2 = parseFloat(sorted[i + 1][field]) || 0;
        const ratio = (elapsedYears - y1) / (y2 - y1);
        return v1 + (v2 - v1) * ratio;
      }
    }
    return 0;
  }

  // ===== 万能账户精确日值计算（不依赖DOM） =====
  function calcUADailyValueAtDate(policy, targetDate) {
    if (!policy || !policy.universalAccount || !policy.startDate) return null;
    const ua = policy.universalAccount;
    const fundFlows = ua.fundFlows || [];
    // 合并年金转入记录
    const transferRecords = ua.transferRecords || [];
    const allFlowsForCalc = [...fundFlows];
    transferRecords.forEach(t => {
      if (t.amount > 0) {
        allFlowsForCalc.push({
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
    if (allFlowsForCalc.length === 0) return null;

    const interestRates = ua.interestRates || [];
    const startDate = new Date(policy.startDate);
    const target = new Date(targetDate);
    if (isNaN(startDate.getTime()) || isNaN(target.getTime())) return null;
    if (target < startDate) return 0;

    const sumAssured = parseFloat(policy.sumAssured) || 0;
    const insuredAge = parseInt(policy.insuredAge) || 0;
    const entryRate = (parseFloat(ua.entryRate) || 100) / 100;
    const mgmtFeeMonthly = parseFloat(ua.mgmtFee) || 0;
    const riskFeeType = ua.riskFeeType || 'none';
    const riskFeeRate = parseFloat(ua.riskFeeRate) || 0;
    const riskNetCalc = ua.riskNetCalc || 'basicSum';
    const riskFeeTable = ua.riskFeeTable || [];
    const coefficientTable = ua.coefficientTable || [];

    const current = new Date(startDate);
    let accountValue = 0;
    const feeReturnQueue = [];

    // Sort flows (including transfer records)
    const allFlows = allFlowsForCalc.map(f => ({ ...f }));
    allFlows.sort((a, b) => a.date.localeCompare(b.date));

    while (current <= target) {
      const dateStr = current.toISOString().slice(0, 10);

      for (const f of allFlows) {
        if (f.date === dateStr) {
          const fee = parseFloat(f.amount || 0) * (parseFloat(f.feeRate || 0) / 100);
          if (f.flowType === 'in') {
            accountValue += (parseFloat(f.amount || 0) - fee);
          } else {
            accountValue -= (parseFloat(f.amount || 0) + fee);
          }
          if (f.returnType === 'afterN' && parseInt(f.returnN || 0) > 0) {
            let triggerDateStr;
            if (f.returnDate) {
              triggerDateStr = f.returnDate;
            } else {
              const rd = new Date(f.date);
              rd.setFullYear(rd.getFullYear() + parseInt(f.returnN));
              triggerDateStr = rd.toISOString().slice(0,10);
            }
            feeReturnQueue.push({ triggerDate: triggerDateStr, amount: fee });
          } else if (f.returnType === 'immediate') {
            accountValue += fee;
          }
        }
      }

      for (let i = feeReturnQueue.length - 1; i >= 0; i--) {
        if (dateStr >= feeReturnQueue[i].triggerDate) {
          accountValue += feeReturnQueue[i].amount;
          feeReturnQueue.splice(i, 1);
        }
      }

      // Risk fee (daily)
      const ageAtDay = insuredAge + Math.floor((current - startDate) / (365.25 * 24 * 3600 * 1000));
      if (riskFeeType === 'sumAssured') {
        const riskNet = (riskNetCalc === 'basicSum') ? sumAssured : Math.max(0, sumAssured - accountValue);
        if (riskNet > 0) {
          accountValue -= (riskNet / 1000) * riskFeeRate / 365;
        }
      } else if (riskFeeType === 'table') {
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
        const coeffRow = coefficientTable.find(c => ageAtDay >= (c.startAge || 0) && ageAtDay <= (c.endAge || 999));
        const coeff = coeffRow ? parseFloat(coeffRow.coefficient) || 100 : 100;
        // 有效保险金额 = Max(账户价值, 基本保险金额 × 给付系数)
        const effectiveSum = Math.max(accountValue, dynamicBasicSum * coeff / 100);
        // 风险保险金额
        const riskNetCalcLocal = riskNetCalc || 'basicSum';
        const riskNet = (riskNetCalcLocal === 'basicSum') ? effectiveSum : Math.max(0, effectiveSum - accountValue);
        const row = riskFeeTable.find(r => ageAtDay >= (parseInt(r.startAge) || 0) && ageAtDay <= (parseInt(r.endAge) || 999));
        if (row && parseFloat(row.rate || 0) > 0 && riskNet > 0) {
          accountValue -= (riskNet / 1000) * parseFloat(row.rate) / 365;
        }
      }

      // Management fee (daily)
      const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
      accountValue -= mgmtFeeMonthly / daysInMonth;
      if (accountValue < 0) accountValue = 0;

      // Daily interest
      const monthStr = current.toISOString().slice(0, 7);
      let annualRate = 0;
      for (const r of interestRates) {
        if (r.yearMonth <= monthStr) annualRate = parseFloat(r.rate) || 0;
        else break;
      }
      if (annualRate <= 0) annualRate = parseFloat(interestRates.length > 0 ? interestRates[0].rate : 3.5) || 3.5;
      accountValue += accountValue * (annualRate / 100 / 365);

      current.setDate(current.getDate() + 1);
    }

    return Math.round(accountValue);
  }
  function calcBenefitComponentsAtDate(policy, baseDate) {
    // For universal policies with UA config, use precise daily calculation
    if (policy.designType === '万能型' && policy.universalAccount && policy.universalAccount.fundFlows && policy.universalAccount.fundFlows.length > 0) {
      const uaAV = calcUADailyValueAtDate(policy, baseDate);
      if (uaAV !== null) {
        return {
          cashValue: uaAV,
          dividend: 0,
          cumAnnuity: 0,
          cumOtherIncome: 0,
          maturityAmt: 0,
          isMatured: false
        };
      }
    }

    const cv = policy.cashValues;
    if (!cv || cv.length === 0 || !policy.startDate) return null;
    const start = new Date(policy.startDate);
    if (isNaN(start.getTime())) return null;
    const elapsedYears = (baseDate - start) / (365.25 * 24 * 3600 * 1000);
    const sorted = [...cv].sort((a, b) => (parseInt(a.year) || 0) - (parseInt(b.year) || 0));

    let maturityElapsedYears = null;
    let isMatured = false;
    if (policy.maturityDate) {
      const md = new Date(policy.maturityDate);
      if (!isNaN(md.getTime())) {
        maturityElapsedYears = (md - start) / (365.25 * 24 * 3600 * 1000);
        isMatured = baseDate >= md;
      }
    }
    const useElapsed = isMatured ? maturityElapsedYears : elapsedYears;

    // 现金价值（满期后为0）
    const cashVal = isMatured ? 0 : Math.round(interpolateValue(sorted, elapsedYears, 'cashValue'));

    // 累计红利（满期后停在满期时值）
    let dividend = 0;
    if (policy.designType === '分红型') {
      dividend = Math.round(interpolateValue(sorted, useElapsed, 'dividend'));
    }

    // 累计年金
    let cumAnnuity = 0;
    const isAnnuity = policy.productCategory === '年金保险' || policy.productCategory === '养老年金保险';
    const isMonthly = policy.isMonthlyPayout || false;
    if (policy.manualAnnuity) {
      // 手动年金：从第1年查表，不判断产品类别和 annuityStart
      const fullYears = Math.floor(useElapsed);
      for (let y = 1; y <= fullYears; y++) {
        const row = sorted[y - 1];
        const annuityAmt = parseFloat(row?.annuityAmount || 0) || 0;
        // 排除转入万能的年金（不计入年金利益）
        if (!(row && row.transferToUA)) {
          cumAnnuity += (isMonthly ? annuityAmt * 12 : annuityAmt);
        }
      }
      // 月领：补充当前年度部分月份
      if (isMonthly && fullYears < sorted.length) {
        const totalMonths = Math.floor(useElapsed * 12);
        const fullYearMonths = fullYears * 12;
        const partialMonths = totalMonths - fullYearMonths;
        if (partialMonths > 0) {
          const row = sorted[fullYears];
          if (!(row && row.transferToUA)) {
            cumAnnuity += (parseFloat(sorted[fullYears]?.annuityAmount || 0) || 0) * partialMonths;
          }
        }
      }
    } else if (isAnnuity && policy.annuityStartDate && start && !isNaN(start.getTime())) {
      const annuityStart = new Date(policy.annuityStartDate);
      if (!isNaN(annuityStart.getTime()) && baseDate >= annuityStart) {
        // 非手动：仅年金/养老年金产品，需等到年金开始后才计算
        const annualPayout = parseFloat(policy.annualPayout) || 0;
        const monthlyPayout = parseFloat(policy.monthlyPayout) || 0;
        const annuityStartElapsed = (annuityStart - start) / (365.25 * 24 * 3600 * 1000);
        const elapsedFromAnnuityStart = Math.max(0, useElapsed - annuityStartElapsed);
        if (isMonthly) {
          const totalMonths = Math.floor(elapsedFromAnnuityStart * 12);
          cumAnnuity = totalMonths * monthlyPayout;
        } else {
          const periods = Math.ceil(elapsedFromAnnuityStart);
          cumAnnuity = periods * annualPayout;
        }
      }
    }
    cumAnnuity = Math.round(cumAnnuity);

    // 累计其他收入（满期后停止）
    let cumOtherIncome = 0;
    if (policy.hasOtherIncome) {
      const fullYears = Math.floor(useElapsed);
      for (let y = 1; y <= fullYears; y++) {
        cumOtherIncome += parseFloat(sorted[y - 1]?.otherIncome || 0) || 0;
      }
    }
    cumOtherIncome = Math.round(cumOtherIncome);

    // 满期金
    let maturityAmt = 0;
    if (isMatured) {
      maturityAmt = parseFloat(policy.maturityAmount) || 0;
    }
    maturityAmt = Math.round(maturityAmt);

    return {
      cashValue: cashVal,
      dividend: dividend,
      cumAnnuity: cumAnnuity,
      cumOtherIncome: cumOtherIncome,
      maturityAmt: maturityAmt,
      isMatured: isMatured
    };
  }

  function calcCashValueAtDate(policy, baseDate) {
    const comp = calcBenefitComponentsAtDate(policy, baseDate);
    if (!comp) return null;
    return Math.round((comp.isMatured ? comp.maturityAmt : comp.cashValue) + comp.dividend + comp.cumAnnuity);
  }

  function renderBenefitColValue(p, mode) {
    const comp = calcBenefitComponentsAtDate(p, baseDate);
    if (!comp) return '<span style="color:#9ca3af;">-</span>';
    switch (mode) {
      case 'cashValue': return formatMoneyDisplay(comp.isMatured ? 0 : comp.cashValue);
      case 'dividend': return formatMoneyDisplay(comp.dividend);
      case 'annuity': return formatMoneyDisplay(comp.cumAnnuity);
      case 'maturity': return formatMoneyDisplay(comp.maturityAmt);
      case 'otherIncome': return formatMoneyDisplay(comp.cumOtherIncome);
      case 'totalWithOther': return formatMoneyDisplay(Math.round((comp.isMatured ? comp.maturityAmt : comp.cashValue) + comp.dividend + comp.cumAnnuity + comp.cumOtherIncome));
      default: return formatMoneyDisplay(Math.round((comp.isMatured ? comp.maturityAmt : comp.cashValue) + comp.dividend + comp.cumAnnuity));
    }
  }

  function formatCoverage(p) {
    if (p.coverageType === '终身') return '终身';
    if (p.coverageType === '保至年龄') return p.coverageValue ? `保至 ${p.coverageValue} 岁` : '-';
    if (p.coverageType === '固定年限') return p.coverageValue ? `${p.coverageValue} 年` : '-';
    return '-';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  function toggleSort(field) {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'asc';
    }
    renderTable();
  }

  function adjustProductNameFont() {
    const cells = document.querySelectorAll('.product-name-text');
    cells.forEach(el => {
      el.style.fontSize = '13px';
      const maxWidth = el.parentElement.clientWidth - 20;
      const textWidth = el.scrollWidth;
      if (textWidth > maxWidth && maxWidth > 0) {
        const ratio = maxWidth / textWidth;
        el.style.fontSize = Math.max(10, 13 * ratio) + 'px';
      }
    });
  }

  function updateSortIndicators() {
    document.querySelectorAll('th.sortable').forEach(th => {
      th.classList.remove('asc', 'desc');
    });
    const currentTh = document.querySelector(`th.sortable[onclick="toggleSort('${sortField}')"]`);
    if (currentTh) {
      currentTh.classList.add(sortDirection);
    }
  }

  function resetFilters() {
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterDesignType').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterChannel').value = '';
    document.getElementById('filterSearch').value = '';
    renderTable();
  }

  function updateAutoCalc() {
    const startDate = document.getElementById('startDate').value;
    const paymentTerm = document.getElementById('paymentTerm').value;
    const paidYears = calcPaidYears(startDate, paymentTerm, baseDate);
    const payStatus = calcPaymentStatus(startDate, paymentTerm, baseDate);
    document.getElementById('paidYearsDisplay').value = startDate ? paidYears + ' 年' : '-';
    document.getElementById('paymentStatusDisplay').value = payStatus !== '待确认' ? payStatus : '-';
  }
