import React, { useState, useEffect, useMemo } from 'react';

// --- Icons ---
const Cpu = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>;
const Network = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>;
const Layers = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
const Terminal = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>;

// --- Visualizer Components ---

// Week 1: Ring
const RingVisualizer = () => {
  const [head, setHead] = useState(0);
  const [tail, setTail] = useState(0);
  const size = 12;

  useEffect(() => {
    const interval = setInterval(() => {
      setTail(t => (t + 1) % size);
      setTimeout(() => setHead(h => (h + 1) % size), 800);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', color: '#f8fafc' }}>
      <h4 style={{ marginBottom: '15px', color: '#38bdf8' }}>MPMC Ring (Atomic Synchronization)</h4>
      <div style={{ position: 'relative', height: '220px', width: '220px', margin: '0 auto' }}>
        {[...Array(size)].map((_, i) => {
          const angle = (i / size) * 2 * Math.PI - Math.PI / 2;
          const x = 95 + 85 * Math.cos(angle);
          const y = 95 + 85 * Math.sin(angle);
          const isFull = (head <= tail) ? (i >= head && i < tail) : (i >= head || i < tail);
          return (
            <div key={i} style={{
              position: 'absolute', left: x, top: y, width: '24px', height: '24px',
              borderRadius: '4px', border: '1px solid #334155',
              backgroundColor: isFull ? '#0ea5e9' : '#1e293b',
              transition: 'all 0.5s ease-in-out',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'
            }}>{i}</div>
          );
        })}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontSize: '11px', textAlign: 'center' }}>
          <div style={{ color: '#fb7185' }}>Prod_Head: {tail}</div>
          <div style={{ color: '#34d399' }}>Cons_Tail: {head}</div>
        </div>
      </div>
      <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '15px', lineHeight: '1.4' }}>
        The ring works by moving indices. Producers reserve space by moving <code>prod_head</code>. Consumers finalize by moving <code>cons_tail</code>. This eliminates the need for expensive spinlocks.
      </p>
    </div>
  );
};

// Week 2: Mbuf
const MbufVisualizer = () => (
  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
    <h4 style={{ color: '#475569', marginBottom: '15px' }}>rte_mbuf Multi-Cache Line Layout</h4>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ padding: '12px', background: '#3b82f6', color: 'white', borderRadius: '4px', textAlign: 'center', fontSize: '12px' }}>
        <strong>Cache Line 0 (64B)</strong>: Metadata, Refs, Port, Packet Type
      </div>
      <div style={{ padding: '12px', background: '#60a5fa', color: 'white', borderRadius: '4px', textAlign: 'center', fontSize: '12px' }}>
        <strong>Cache Line 1 (64B)</strong>: Offload Flags, RSS Hash, VLAN
      </div>
      <div style={{ display: 'flex', gap: '4px', height: '100px' }}>
        <div style={{ flex: '0 0 60px', background: '#fee2e2', border: '1px solid #f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', textAlign: 'center' }}>Headroom (Encapsulation)</div>
        <div style={{ flex: 1, background: '#dcfce7', border: '1px solid #4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>GTP-U / Payload</div>
        <div style={{ flex: '0 0 40px', background: '#fef9c3', border: '1px solid #facc15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>Tailroom</div>
      </div>
    </div>
    <p style={{ marginTop: '15px', fontSize: '11px', color: '#64748b' }}>
      In 5G, we prepend GTP-U headers. <code>headroom</code> allows us to simply adjust the <code>data_off</code> pointer instead of re-allocating memory.
    </p>
  </div>
);

// Week 3: Mempool
const MempoolVisualizer = () => {
  const [coreCache, setCoreCache] = useState([1, 1, 1]);
  const handleAlloc = () => {
    if (coreCache.length > 0) setCoreCache(prev => prev.slice(1));
    else setCoreCache([1, 1, 1, 1]); // Refill simulation
  };

  return (
    <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', color: 'white' }}>
      <h4 style={{ color: '#a78bfa' }}>Mempool Local Cache Logic</h4>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', minHeight: '120px' }}>
        <div style={{ width: '80px', border: '2px solid #334155', padding: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px' }}>Shared Ring</div>
          {[...Array(5)].map((_, i) => <div key={i} style={{ height: '8px', background: '#4c1d95', margin: '4px 0' }} />)}
        </div>
        <div style={{ fontSize: '20px' }}>←</div>
        <div style={{ width: '120px', padding: '10px', border: '1px dashed #a78bfa', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', textAlign: 'center', marginBottom: '8px' }}>Lcore Local Stack</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {coreCache.map((_, i) => <div key={i} style={{ width: '12px', height: '12px', background: '#10b981' }} />)}
          </div>
        </div>
      </div>
      <button onClick={handleAlloc} style={{ width: '100%', padding: '8px', background: '#4c1d95', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px', fontSize: '12px' }}>
        Simulate rte_mempool_get()
      </button>
      <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>
        Fast path allocations come from the <strong>Local Stack</strong>. We only touch the <strong>Shared Ring</strong> in bulk to refill the cache, avoiding core-to-core contention.
      </p>
    </div>
  );
};

// Week 4: EAL
const EalVisualizer = () => (
  <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
    <h4 style={{ color: '#0369a1', marginBottom: '10px' }}>Memory Mapping Strategy</h4>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
      <div style={{ padding: '10px', border: '1px solid #0ea5e9', borderRadius: '6px', background: 'white' }}>
        <div style={{ fontWeight: 'bold', fontSize: '11px' }}>Standard Page (4KB)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', marginTop: '5px' }}>
          {[...Array(16)].map((_, i) => <div key={i} style={{ height: '6px', background: '#e0f2fe' }} />)}
        </div>
        <div style={{ fontSize: '9px', marginTop: '5px', color: '#ef4444' }}>High TLB Pressure</div>
      </div>
      <div style={{ padding: '10px', border: '1px solid #0ea5e9', borderRadius: '6px', background: 'white' }}>
        <div style={{ fontWeight: 'bold', fontSize: '11px' }}>Hugepage (1GB)</div>
        <div style={{ height: '34px', background: '#0ea5e9', marginTop: '5px', borderRadius: '2px' }} />
        <div style={{ fontSize: '9px', marginTop: '5px', color: '#10b981' }}>Minimal TLB Misses</div>
      </div>
    </div>
    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '15px' }}>
      EAL sets up <code>mmap</code> for hugepages. This ensures the CPU's Translation Lookaside Buffer (TLB) hits nearly every time, critical for maintaining throughput at 100Mpps.
    </p>
  </div>
);

// Week 5: PMD
const PmdVisualizer = () => {
  const [active, setActive] = useState(0);
  return (
    <div style={{ padding: '20px', backgroundColor: '#fdf2f8', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
      <h4 style={{ color: '#db2777' }}>Poll Mode Driver Execution</h4>
      <div style={{ fontFamily: 'monospace', fontSize: '12px', backgroundColor: 'white', padding: '15px', borderRadius: '6px', border: '1px solid #f9a8d4' }}>
        <div>while (true) &#123;</div>
        <div style={{ paddingLeft: '20px', color: active === 0 ? '#db2777' : '#94a3b8', fontWeight: active === 0 ? 'bold' : 'normal' }}>
          nb_rx = rte_eth_rx_burst(p, q, m, 32);
        </div>
        <div style={{ paddingLeft: '20px', color: active === 1 ? '#db2777' : '#94a3b8', fontWeight: active === 1 ? 'bold' : 'normal' }}>
          if (nb_rx {'>'} 0) process_pkts(m, nb_rx);
        </div>
        <div style={{ paddingLeft: '20px', color: active === 2 ? '#db2777' : '#94a3b8', fontWeight: active === 2 ? 'bold' : 'normal' }}>
          rte_eth_tx_burst(p, q, m, nb_tx);
        </div>
        <div>&#125;</div>
      </div>
      <button 
        onClick={() => setActive((active + 1) % 3)}
        style={{ marginTop: '15px', width: '100%', padding: '10px', background: '#db2777', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
      >
        Trigger Burst Cycle
      </button>
      <p style={{ fontSize: '11px', color: '#be185d', marginTop: '10px' }}>
        Unlike kernel drivers, DPDK never sleeps. The PMD busy-waits, resulting in 100% CPU usage but 0% interrupt latency.
      </p>
    </div>
  );
};

// Week 6: L3fwd
const L3fwdVisualizer = () => {
  const [progress, setProgress] = useState(0);
  const steps = ["Port RX", "Header Parse", "LPM Lookup", "MAC Update", "Port TX"];
  
  useEffect(() => {
    const timer = setInterval(() => setProgress(p => (p + 1) % 5), 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ background: '#1e293b', color: 'white', padding: '20px', borderRadius: '12px' }}>
      <h4 style={{ marginBottom: '15px' }}>L3 Forwarding Trace</h4>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        {steps.map((s, i) => (
          <div key={i} style={{ textAlign: 'center', zIndex: 1 }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', background: progress === i ? '#3b82f6' : '#334155',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', margin: '0 auto',
              transition: 'all 0.3s'
            }}>
              {i + 1}
            </div>
            <div style={{ fontSize: '10px', marginTop: '5px', color: progress === i ? '#fff' : '#94a3b8' }}>{s}</div>
          </div>
        ))}
        <div style={{ position: 'absolute', top: '16px', left: '0', right: '0', height: '2px', background: '#334155', zIndex: 0 }} />
      </div>
      <div style={{ marginTop: '20px', padding: '10px', background: '#0f172a', borderRadius: '6px', fontSize: '12px', borderLeft: '3px solid #3b82f6' }}>
        {progress === 0 && "Fetching mbufs from NIC hardware ring."}
        {progress === 1 && "Accessing mbuf metadata to extract IPv4 address."}
        {progress === 2 && "Searching routing table using Longest Prefix Match."}
        {progress === 3 && "Rewriting L2 headers (MAC) for next hop."}
        {progress === 4 && "Placing packet in TX ring for wire transmission."}
      </div>
    </div>
  );
};

// Week 7: Hash
const HashVisualizer = () => (
  <div style={{ background: '#fdfaf1', padding: '20px', borderRadius: '12px', border: '1px solid #fde68a' }}>
    <h4 style={{ color: '#b45309', marginBottom: '10px' }}>Cuckoo Hash (Exact Match)</h4>
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', background: '#fffbeb', padding: '8px', border: '1px solid #fde68a' }}>
          <strong>Key</strong>: UE_IP + TEID
        </div>
        <div style={{ textAlign: 'center', margin: '5px 0' }}>↓</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <div style={{ background: '#fbbf24', height: '20px', fontSize: '10px', padding: '4px' }}>H1</div>
          <div style={{ background: '#fbbf24', height: '20px', fontSize: '10px', padding: '4px' }}>H2</div>
        </div>
      </div>
      <div style={{ flex: 1, height: '80px', border: '1px solid #d97706', display: 'flex', flexDirection: 'column' }}>
        {[...Array(6)].map((_, i) => <div key={i} style={{ flex: 1, borderBottom: '1px solid #fde68a', background: i === 2 || i === 5 ? '#f59e0b' : 'white' }} />)}
      </div>
    </div>
    <p style={{ fontSize: '11px', color: '#92400e', marginTop: '10px' }}>
      Cuckoo hashing ensures $O(1)$ lookups. If a collision occurs at H1, it moves the existing entry to its H2 position. Perfect for 5G session tables.
    </p>
  </div>
);

// Week 8: LPM
const LpmVisualizer = () => {
  const [ip, setIp] = useState("192.168.1.1");
  return (
    <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
      <h4 style={{ color: '#15803d', marginBottom: '10px' }}>DIR24-8 LPM Algorithm</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '12px', background: 'white', padding: '8px', borderRadius: '4px', border: '1px solid #dcfce7' }}>
          IP: <input value={ip} onChange={e => setIp(e.target.value)} style={{ border: 'none', background: '#f0fdf4', color: '#166534', fontWeight: 'bold' }} />
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <div style={{ flex: 3, background: '#166534', color: 'white', padding: '10px', fontSize: '11px', textAlign: 'center', borderRadius: '4px' }}>
            TBL24 (16M Entries)<br/><span style={{ fontSize: '9px' }}>First 24 bits resolved in 1 Access</span>
          </div>
          <div style={{ flex: 1, background: '#22c55e', color: 'white', padding: '10px', fontSize: '11px', textAlign: 'center', borderRadius: '4px' }}>
            TBL8<br/><span style={{ fontSize: '9px' }}>Last 8 bits</span>
          </div>
        </div>
      </div>
      <p style={{ fontSize: '11px', color: '#166534', marginTop: '10px' }}>
        DIR24-8 prioritizes speed over memory. Most routes are resolved in <strong>one memory read</strong>, providing deterministic latency regardless of table size.
      </p>
    </div>
  );
};

// Week 9: Graph
const GraphVisualizer = () => (
  <div style={{ background: '#f5f3ff', padding: '20px', borderRadius: '12px', border: '1px solid #ddd6fe' }}>
    <h4 style={{ color: '#6d28d9', marginBottom: '10px' }}>Vector Processing (rte_graph)</h4>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ padding: '8px', background: '#6d28d9', color: 'white', borderRadius: '6px', fontSize: '10px' }}>Eth_RX</div>
      <div style={{ fontSize: '14px' }}>→</div>
      <div style={{ flex: 1, padding: '10px', background: '#8b5cf6', color: 'white', borderRadius: '6px', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>IP_Lookup Node</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '5px' }}>
          {[...Array(8)].map((_, i) => <div key={i} style={{ width: '8px', height: '8px', background: 'white', borderRadius: '1px' }} />)}
        </div>
        <div style={{ fontSize: '9px', marginTop: '4px' }}>Batch of 32 Packets</div>
      </div>
      <div style={{ fontSize: '14px' }}>→</div>
      <div style={{ padding: '8px', background: '#6d28d9', color: 'white', borderRadius: '6px', fontSize: '10px' }}>Eth_TX</div>
    </div>
    <p style={{ fontSize: '11px', color: '#5b21b6', marginTop: '15px' }}>
      Graph framework processes <strong>vectors</strong> of packets. This keeps the CPU's Instruction Cache (I-Cache) warm by running the same code on many packets sequentially.
    </p>
  </div>
);

// Week 10: Eventdev
const EventdevVisualizer = () => {
  const [events, setEvents] = useState([0, 1, 2]);
  useEffect(() => {
    const timer = setInterval(() => {
      setEvents(prev => [...prev.slice(1), (prev[prev.length - 1] + 1) % 10]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ background: '#fff1f2', padding: '20px', borderRadius: '12px', border: '1px solid #fecdd3' }}>
      <h4 style={{ color: '#e11d48', marginBottom: '10px' }}>Eventdev Scheduler (ATOMIC)</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
          {events.map((e, i) => (
            <div key={i} style={{ width: '25px', height: '25px', background: '#e11d48', color: 'white', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              P{e}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ padding: '10px', background: 'white', border: '2px solid #fda4af', textAlign: 'center' }}>
            <div style={{ fontSize: '10px' }}>Worker 1</div>
            <div style={{ height: '10px', background: '#fb7185', marginTop: '5px' }} />
          </div>
          <div style={{ padding: '10px', background: 'white', border: '2px solid #fda4af', textAlign: 'center' }}>
            <div style={{ fontSize: '10px' }}>Worker 2</div>
            <div style={{ height: '10px', background: '#fb7185', marginTop: '5px', opacity: 0.3 }} />
          </div>
        </div>
      </div>
      <p style={{ fontSize: '11px', color: '#9f1239', marginTop: '15px' }}>
        Eventdev maintains packet order even with multicore scaling. <strong>ATOMIC</strong> flows ensure packets from the same UE session are never processed by two cores simultaneously.
      </p>
    </div>
  );
};

// --- Main Curriculum Data ---

const WEEKS = [
  {
    id: 1, title: "Lock-Free Ring (rte_ring)",
    files: "lib/ring/rte_ring.h, rte_ring_elem.h",
    abstract: "The fundamental synchronization primitive. No mutexes, just CAS (Compare-And-Swap).",
    deepDive: "DPDK rings are multi-producer, multi-consumer (MPMC) fixed-size queues. They avoid the overhead of operating system locks by using atomic primitives. When a producer wants to enqueue, it moves a 'head' index to reserve slots. Only when the write is complete is the 'tail' index updated, making the data visible to consumers.",
    decadeInsight: "In 5G UPF architectures, rings are the high-speed bridges between I/O threads and worker threads. They are the 'pipes' that allow line-rate processing across multiple CPU cores without cache-line bouncing caused by spinlocks.",
    visualizer: <RingVisualizer />
  },
  {
    id: 2, title: "Mbuf Architecture (rte_mbuf)",
    files: "lib/mbuf/rte_mbuf.h, rte_mbuf_core.h",
    abstract: "The carrier of all data. Designed for zero-copy and cache efficiency.",
    deepDive: "The mbuf is split into two parts: the metadata (the mbuf structure itself) and the data buffer. Crucially, the structure is designed to fit into the first two cache lines of a CPU (128 bytes). This ensures that protocol parsing logic doesn't trigger secondary memory fetches.",
    decadeInsight: "6G will likely rely on even more complex encapsulation. The mbuf's 'headroom' and 'tailroom' design is the industry standard for zero-copy encapsulation, allowing headers like GTP-U or SRv6 to be added by simply moving a pointer.",
    visualizer: <MbufVisualizer />
  },
  {
    id: 3, title: "Mempool & Caching (rte_mempool)",
    files: "lib/mempool/rte_mempool.c, rte_mempool.h",
    abstract: "Pre-allocated memory to avoid the 'malloc' tax in the fast path.",
    deepDive: "Mempools use a dual-layer approach. There is a global, shared ring of objects and a local, per-lcore cache. A CPU core always tries to allocate from its local cache first, which involves zero atomic operations and zero lock contention.",
    decadeInsight: "Memory allocation is the silent killer of throughput. By using mempools, DPDK turns a non-deterministic operation (malloc) into a deterministic one (stack pop), which is vital for real-time 5G signal processing.",
    visualizer: <MempoolVisualizer />
  },
  {
    id: 4, title: "EAL & Hugepages",
    files: "lib/eal/common/eal_common_memory.c",
    abstract: "The Environment Abstraction Layer. It makes Linux act like a real-time OS.",
    deepDive: "Standard Linux memory management is tuned for general apps. EAL reconfigures the system for packet processing. It pins threads to cores, allocates memory in 1GB chunks (hugepages) to avoid TLB misses, and identifies the NUMA topology to ensure local memory access.",
    decadeInsight: "In distributed systems, NUMA awareness is everything. A single cross-socket memory access (UPI/QPI) can be 3x slower than a local access, potentially cutting your 100Gbps target in half.",
    visualizer: <EalVisualizer />
  },
  {
    id: 5, title: "PMD & Polling Logic",
    files: "drivers/net/ethdev/rte_ethdev.h",
    abstract: "Saying goodbye to interrupts. The CPU is always ready.",
    deepDive: "Interrupt-driven I/O fails at high packet rates because the context-switch overhead becomes greater than the processing time. PMDs use a burst-based polling model. They fetch up to 32 packets at once, keeping the CPU pipeline full and instruction caches hot.",
    decadeInsight: "As we move to 6G, the polling model remains the gold standard. Modern PMDs now use AVX-512 vector instructions to parallelize the parsing of packet headers within the poll loop.",
    visualizer: <PmdVisualizer />
  },
  {
    id: 6, title: "L3fwd: The Master Sample",
    files: "examples/l3fwd/main.c",
    abstract: "The benchmark app. Everything you've learned comes together here.",
    deepDive: "L3fwd is the canonical example of a DPDK application. It shows how to initialize EAL, setup ports, and run a fast-path loop that performs L3 lookups. It supports both Hash-based exact match and LPM-based prefix matching.",
    decadeInsight: "If you can't reach line-rate in L3fwd, you won't reach it in your custom application. It is the baseline against which all 5G network functions are measured during initial deployment.",
    visualizer: <L3fwdVisualizer />
  },
  {
    id: 7, title: "Hash & Flow Tables",
    files: "lib/hash/rte_cuckoo_hash.c",
    abstract: "Exact match lookups for millions of concurrent flows.",
    deepDive: "DPDK's Hash library uses Cuckoo Hashing. It allows for high-density tables with constant-time lookup. It uses a 4-byte signature to quickly check for potential matches before ever touching the main memory for the full flow key.",
    decadeInsight: "Session tracking is the heart of a UPF. You must track millions of 'UE IP + TEID' combinations. Cuckoo hashing provides the scalability needed to handle the massive connectivity requirements of 5G-Advanced.",
    visualizer: <HashVisualizer />
  },
  {
    id: 8, title: "LPM (Longest Prefix Match)",
    files: "lib/lpm/rte_lpm.c",
    abstract: "The routing engine. Speed is independent of table size.",
    deepDive: "The DIR24-8 algorithm splits the 32-bit IPv4 address space. The first 24 bits point into a 16-million entry table, while the last 8 bits handle the refinements. This ensures that almost every lookup is finished in one or two memory accesses.",
    decadeInsight: "Network slicing requires isolated routing tables. LPM tables in DPDK are lightweight enough that you can instantiate one per slice, ensuring high-speed routing with zero 'noisy neighbor' interference.",
    visualizer: <LpmVisualizer />
  },
  {
    id: 9, title: "RCU & Graph Framework",
    files: "lib/rcu/rte_rcu_qsbr.h, lib/graph/graph.c",
    abstract: "Read-Copy-Update and Programmable Pipelines.",
    deepDive: "The Graph framework moves away from 'run-to-completion' towards 'node-based' processing. By processing a vector (batch) of packets in one node before moving to the next, we maximize Instruction Cache hits. RCU allows these graphs to be updated dynamically without stopping the traffic.",
    decadeInsight: "The complexity of 6G protocol stacks (AI-driven PHY, sub-THz headers) will make modularity essential. The Graph framework provides the modularity of microservices with the performance of a monolithic fast-path.",
    visualizer: <GraphVisualizer />
  },
  {
    id: 10, title: "Eventdev: The Load Balancer",
    files: "lib/eventdev/rte_eventdev.h",
    abstract: "Scaling across 128+ cores without losing packet order.",
    deepDive: "Eventdev is the most advanced DPDK library. It acts as a hardware/software scheduler that dynamically distributes work to cores based on load. Crucially, it handles flow ordering (Atomic) and synchronization (Ordered) automatically.",
    decadeInsight: "Modern CPUs have hundreds of cores. Manual thread management is no longer feasible. Eventdev is the technology that will allow 6G networks to scale horizontally across massive multicore cloud infrastructures.",
    visualizer: <EventdevVisualizer />
  }
];

// --- Main App ---

export default function App() {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const currentWeek = useMemo(() => WEEKS.find(w => w.id === selectedWeek), [selectedWeek]);

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#1e293b', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto 30px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 5px 0', color: '#0f172a' }}>DPDK Decade Mastery</h1>
          <p style={{ margin: 0, color: '#64748b' }}>High-Performance Systems Engineering for 5G/6G Architects</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#94a3b8' }}>
          DPDK 24.11 LTS Deep-Dive<br/>
          Atomic / Lock-Free / Vector
        </div>
      </div>

      <main style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {WEEKS.map(w => (
            <button
              key={w.id}
              onClick={() => setSelectedWeek(w.id)}
              style={{
                padding: '12px 16px', borderRadius: '10px', border: '1px solid',
                borderColor: selectedWeek === w.id ? '#3b82f6' : '#e2e8f0',
                backgroundColor: selectedWeek === w.id ? 'white' : 'transparent',
                textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                transition: 'all 0.2s', boxShadow: selectedWeek === w.id ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none'
              }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: selectedWeek === w.id ? '#3b82f6' : '#cbd5e1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                {w.id}
              </div>
              <span style={{ fontSize: '13px', fontWeight: selectedWeek === w.id ? '600' : '400', color: selectedWeek === w.id ? '#1e293b' : '#64748b' }}>
                {w.title}
              </span>
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', border: '1px solid #e2e8f0' }}>
          <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '30px', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#3b82f6', fontWeight: 'bold', fontSize: '13px', marginBottom: '10px' }}>
              <Layers /> MODULE {currentWeek.id}: ARCHITECTURAL DEEP DIVE
            </div>
            <h2 style={{ fontSize: '30px', margin: '0 0 15px 0', color: '#0f172a' }}>{currentWeek.title}</h2>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
              <Terminal />
              <code style={{ fontSize: '12px', color: '#6366f1', background: '#f5f3ff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e0e7ff' }}>
                {currentWeek.files}
              </code>
            </div>
            <p style={{ fontSize: '17px', lineHeight: '1.6', color: '#475569', margin: 0 }}>
              {currentWeek.abstract}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px' }}>
            <div>
              <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a', marginBottom: '15px' }}>
                <Cpu /> Fast-Path Engineering Mechanics
              </h3>
              <p style={{ lineHeight: '1.7', color: '#4b5563', fontSize: '14px', marginBottom: '25px' }}>
                {currentWeek.deepDive}
              </p>

              <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #3b82f6', marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e3a8a' }}>
                  <Network /> 5G/6G & Distributed Systems Connectivity
                </h4>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#334155', fontStyle: 'italic' }}>
                  "{currentWeek.decadeInsight}"
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '15px', color: '#0f172a', marginBottom: '10px' }}>Mastery Deliverables</h4>
                <ul style={{ paddingLeft: '20px', color: '#64748b', fontSize: '13px', lineHeight: '1.8' }}>
                  <li><strong>Static Analysis</strong>: Identify cache line boundaries in the public header.</li>
                  <li><strong>Path Trace</strong>: Map the execution from API call to hardware register update.</li>
                  <li><strong>Experiment</strong>: Measure latency vs. batch size impact on L1 Instruction Cache hits.</li>
                </ul>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ position: 'sticky', top: '20px' }}>
                {currentWeek.visualizer}
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fffbeb', borderRadius: '10px', border: '1px solid #fef3c7' }}>
                  <h5 style={{ margin: '0 0 8px 0', color: '#92400e', fontSize: '13px', fontWeight: 'bold' }}>Architect's Note</h5>
                  <p style={{ margin: 0, fontSize: '12px', color: '#b45309', lineHeight: '1.5' }}>
                    Fundamental bottlenecks in the next decade will be <strong>Memory Bandwidth</strong> and <strong>Cache Coherency</strong>. All DPDK logic is designed to minimize 'Cross-Talk' between CPU cores.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer style={{ maxWidth: '1200px', margin: '50px auto 20px auto', textAlign: 'center', padding: '20px', borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '12px' }}>
        Designed for High-Throughput / Ultra-Low Latency Systems Development • 2024-2034 Mastery Roadmap
      </footer>
    </div>
  );
}
