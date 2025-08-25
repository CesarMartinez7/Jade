import { motion } from 'framer-motion';
import { diff } from 'jsondiffpatch';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { CodeEditorLazy, JsonViewerLazy } from '../components/lazy';
import { JsonNode } from './formatter/formatter';

export default function JsonDiffViewerModal() {
  const [json1, setJson1] = useState('');
  const [json2, setJson2] = useState('');
  const [diffResult, setDiffResult] = useState<object | null>(null);
  const [error, setError] = useState('Pegue su JSON Aqui');

  const handleCompare = () => {
    try {
      const parsed1 = JSON.parse(json1);
      const parsed2 = JSON.parse(json2);
      const delta = diff(parsed1, parsed2);
      setDiffResult(delta as object);
      setError('');

      if (diffResult === undefined) {
        toast.success('No hay diferencias entre los dos JSON');
      }
    } catch {
      toast.error('JSON invalido');
      setError('JSON inválido 🫠');
      setDiffResult(null);
    }
  };

  const handleSetJson = (value: string, jsonNumber: number) => {
    if (jsonNumber === 1) {
      setJson1(value);
      return;
    }

    setJson2(value);
  };

  return (
    <motion.div
      className="max-w-7xl mx-auto h-full min-h-[90vh] flex flex-col p-6 rounded-2xl shadow-2xl text-sm bg-zinc-900 border border-zinc-800 text-zinc-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-center text-xl font-bold mb-4 bg-gradient-to-bl from-white to-zinc-600 bg-clip-text text-transparent">
        Comparador JSON
      </h2>
      <div className="flex-1 grid md:grid-cols-2 gap-4">
        <div className="flex flex-col h-full">
          <label className="mb-1 text-zinc-400 font-medium">JSON #1</label>
          <div className="flex-1 overflow-hidden">
            <CodeEditorLazy
              minHeight="200px"
              classNameContainer="bg-zinc-950 text-zinc-100 rounded-lg h-full overflow-hidden resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={error}
              language="json"
              value={json1}
              onChange={(e) => handleSetJson(e, 1)}
            />
          </div>
        </div>

        <div className="flex flex-col h-full">
          <label className="mb-1 text-zinc-400 font-medium">JSON #2</label>
          <div className="flex-1 overflow-hidden">
            <CodeEditorLazy
              minHeight="200px"
              classNameContainer="bg-zinc-950 text-zinc-100 rounded-lg h-full overflow-hidden resize-none focus:outline-none focus:ring-2"
              placeholder={error}
              language="json"
              value={json2}
              onChange={(e) => handleSetJson(e, 2)}
            />
          </div>
        </div>
      </div>

      <div className="text-center my-4">
        <button
          onClick={handleCompare}
          className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-2 rounded-lg shadow-lg transition-colors"
        >
          Comparar
        </button>
      </div>

      {diffResult !== null && (
        <div className="flex-1 overflow-y-auto p-4 rounded-lg bg-zinc-950">
          <h3 className="text-xl font-semibold mb-2">Resultado 🎅</h3>
          <div className='overflow-y-scroll max-h-[400px]'>
          <JsonNode data={diffResult} __changed={diffResult} />

          </div>
        </div>
      )}
      {diffResult === undefined && (
        <p className="text-center p-4 text-green-400">No hay Cambios</p>
      )}
    </motion.div>
  );
}
