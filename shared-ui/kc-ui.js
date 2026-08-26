(function (global) {
  'use strict';

  const VERSION = '0.1.0';

  function assertECharts() {
    if (!global.echarts) throw new Error('KCUI: Apache ECharts wurde nicht geladen.');
  }

  function normalizeElement(target) {
    if (typeof target === 'string') return document.querySelector(target);
    return target;
  }

  function gauge(target, config = {}) {
    assertECharts();
    const el = normalizeElement(target);
    if (!el) throw new Error('KCUI.gauge: Ziel-Element nicht gefunden.');

    const chart = global.echarts.init(el);
    const value = Number(config.value ?? 0);
    const min = Number(config.min ?? 0);
    const max = Number(config.max ?? 100);
    const unit = config.unit ?? '';
    const label = config.label ?? '';

    chart.setOption({
      animationDuration: 450,
      series: [{
        type: 'gauge',
        min,
        max,
        startAngle: 210,
        endAngle: -30,
        radius: '92%',
        splitNumber: config.splitNumber ?? 5,
        progress: {
          show: true,
          width: 9,
          roundCap: true
        },
        axisLine: {
          roundCap: true,
          lineStyle: { width: 9 }
        },
        pointer: {
          show: config.pointer !== false,
          width: 4,
          length: '58%',
          itemStyle: { color: 'auto' }
        },
        anchor: {
          show: config.pointer !== false,
          size: 8,
          itemStyle: { borderWidth: 2 }
        },
        axisTick: {
          distance: -15,
          splitNumber: 4,
          lineStyle: { width: 1 }
        },
        splitLine: {
          distance: -18,
          length: 10,
          lineStyle: { width: 2 }
        },
        axisLabel: {
          distance: 19,
          fontSize: 10
        },
        title: {
          show: true,
          offsetCenter: [0, '68%'],
          fontSize: 11
        },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '34%'],
          fontSize: 20,
          formatter: `{value}${unit ? ' ' + unit : ''}`
        },
        data: [{ value, name: label }]
      }]
    });

    const resize = () => chart.resize();
    global.addEventListener('resize', resize);

    return {
      chart,
      setValue(nextValue) {
        chart.setOption({ series: [{ data: [{ value: Number(nextValue), name: label }] }] });
      },
      resize,
      destroy() {
        global.removeEventListener('resize', resize);
        chart.dispose();
      }
    };
  }

  function statusLed(target, state = 'ok', text = '') {
    const el = normalizeElement(target);
    if (!el) throw new Error('KCUI.statusLed: Ziel-Element nicht gefunden.');
    const valid = ['ok', 'warn', 'error', 'info', 'idle'];
    const normalized = valid.includes(state) ? state : 'idle';
    el.className = `kc-status-led kc-status-led--${normalized}`;
    el.innerHTML = `<span class="kc-status-led__dot" aria-hidden="true"></span><span class="kc-status-led__text"></span>`;
    el.querySelector('.kc-status-led__text').textContent = text;
    el.setAttribute('data-state', normalized);
    return el;
  }

  global.KCUI = Object.freeze({ VERSION, gauge, statusLed });
})(window);
