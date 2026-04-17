import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Download, Send, PlusCircle, LayoutDashboard } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function SmartSchoolSync() {
  const [dataNilai, setDataNilai] = useState([]);
  const [form, setForm] = useState({ mapel: '', nilai: '' });

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('realtime-school')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rekap_nilai' }, fetchData)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('rekap_nilai').select('*').order('subject');
    if (data) setDataNilai(data);
  };

  const simpanData = async (e) => {
    e.preventDefault();
    await supabase.from('rekap_nilai').upsert({ subject: form.mapel, average_score: form.nilai }, { onConflict: 'subject' });
    setForm({ mapel: '', nilai: '' });
  };

  const cetakPDF = () => {
    const doc = new jsPDF();
    doc.text('REKAP NILAI SMART SCHOOL', 14, 15);
    doc.autoTable({
      head: [['Mata Pelajaran', 'Skor Rata-rata']],
      body: dataNilai.map(d => [d.subject, d.average_score]),
      startY: 25,
    });
    doc.save('laporan-sekolah.pdf');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <LayoutDashboard size={28} />
        <h1 style={{ marginLeft: '10px' }}>Aspiring Sync Web</h1>
      </header>

      <main style={styles.main}>
        {/* Visualisasi Grafik */}
        <section style={styles.card}>
          <h3 style={styles.cardTitle}>Grafik Performa Akademik</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={dataNilai}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="average_score" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div style={styles.grid}>
          {/* Form Input */}
          <section style={styles.card}>
            <h3 style={styles.cardTitle}><PlusCircle size={18} /> Update Nilai</h3>
            <form onSubmit={simpanData}>
              <input 
                placeholder="Mata Pelajaran" 
                style={styles.input} 
                value={form.mapel}
                onChange={e => setForm({...form, mapel: e.target.value})}
              />
              <input 
                type="number" 
                placeholder="Nilai Rata-rata" 
                style={styles.input} 
                value={form.nilai}
                onChange={e => setForm({...form, nilai: e.target.value})}
              />
              <button type="submit" style={styles.btnBlue}>Sinkronkan Data</button>
            </form>
          </section>

          {/* Fitur Laporan */}
          <section style={styles.card}>
            <h3 style={styles.cardTitle}>Laporan & Distribusi</h3>
            <button onClick={cetakPDF} style={styles.btnOutline}><Download size={16} /> Unduh PDF</button>
            <button 
              onClick={() => window.open(`https://wa.me/?text=Laporan Nilai Terbaru: ${JSON.stringify(dataNilai)}`)}
              style={styles.btnGreen}
            >
              <Send size={16} /> Kirim WhatsApp
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { fontFamily: 'Inter, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' },
  header: { backgroundColor: '#1e3a8a', color: 'white', padding: '20px', display: 'flex', alignItems: 'center' },
  main: { padding: '20px', maxWidth: '1000px', margin: 'auto' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' },
  cardTitle: { marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' },
  input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
  btnBlue: { width: '100%', padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  btnOutline: { width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #2563eb', color: '#2563eb', backgroundColor: 'transparent', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
  btnGreen: { width: '100%', padding: '12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }
};