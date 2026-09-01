import React, { useState } from "react";

interface NewExpenseProps {
  isDark: boolean;
}

export default function NewExpense({ isDark }: NewExpenseProps) {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !amount || !date || !paymentMethod) {
      alert("Please fill all required fields.");
      return;
    }

    console.log({
      category,
      amount,
      date,
      paymentMethod,
      description,
    });

    alert("Expense created successfully.");

    setCategory("");
    setAmount("");
    setDate("");
    setPaymentMethod("");
    setDescription("");
  };

  const inputClass = `w-full h-11 rounded-xl border px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${
    isDark
      ? "bg-[#1c1c2e] border-[#2a2a40] text-white placeholder-zinc-500"
      : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
  }`;

  return (
    <div
      className={`rounded-2xl border p-8 ${
        isDark
          ? "bg-[#14141f] border-[#23233a]"
          : "bg-white border-slate-200"
      }`}
    >
      <div className="mb-8">
        <h2 className="text-xl font-semibold">Create New Expense</h2>

        <p
          className={`text-sm mt-2 ${
            isDark ? "text-zinc-500" : "text-slate-500"
          }`}
        >
          Record a new business expense. Previous expenses are not visible to
          Sub Admin.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-6">

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Expense Category *
            </label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Select category</option>
              <option value="Travel">Travel</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Marketing">Marketing</option>
              <option value="Utilities">Utilities</option>
              <option value="Salary">Salary</option>
              <option value="Rent">Rent</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Amount *
            </label>

            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className={inputClass}
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Expense Date *
            </label>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Payment Method *
            </label>

            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Select payment method</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Enter expense details..."
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-indigo-500 ${
                isDark
                  ? "bg-[#1c1c2e] border-[#2a2a40] text-white placeholder-zinc-500"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
              }`}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={() => {
              setCategory("");
              setAmount("");
              setDate("");
              setPaymentMethod("");
              setDescription("");
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition ${
              isDark
                ? "border-[#2a2a40] text-zinc-300 hover:bg-[#1c1c2e]"
                : "border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            Clear
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
          >
            Create Expense
          </button>
        </div>
      </form>
    </div>
  );
}