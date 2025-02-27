import { useState, useEffect } from 'react';
import { PaymentMethod } from '../../types/types';
import { CreditCard, Plus, Trash2, X, Save, Edit } from 'lucide-react';

interface Props {
  methods: PaymentMethod[];
  onChange: (methods: PaymentMethod[]) => void;
}

export default function PaymentMethods({ methods, onChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [newMethod, setNewMethod] = useState<Partial<PaymentMethod>>({
    paymentType: 'creditcard',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [originalMethods, setOriginalMethods] = useState(methods);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const formatDateForDisplay = (date: string) => {
    if (!date) return '';
    if (date.includes('-')) {
      const [year, month] = date.split('-');
      return `${month}/${year.slice(2)}`;
    }
    return date;
  };

  const formatDateForApi = (date: string) => {
    if (!date) return '';
    const [month, year] = date.split('/');
    const fullYear = `20${year}`;
    return `${fullYear}-${month}-01`;
  };

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/users/payments', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const formattedData = data.map((method: PaymentMethod) => ({
          ...method,
          expiryDate: method.expiryDate ? formatDateForDisplay(method.expiryDate) : ''
        }));
        onChange(formattedData);
        setOriginalMethods(formattedData);
        if (formattedData.length > 0 && !selectedMethodId) {
          setSelectedMethodId(formattedData[0].id);
        }
      } else if (response.status === 404) {
        onChange([]);
        setOriginalMethods([]);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const validatePaymentMethod = () => {
    const validationErrors: Record<string, string> = {};
    
    if (newMethod.paymentType === 'creditcard' || newMethod.paymentType === 'debitcard') {
      if (!newMethod.maskedCardNumber || !/^\d{16}$/.test(newMethod.maskedCardNumber)) {
        validationErrors.maskedCardNumber = 'Please enter a valid 16-digit card number (e.g., 4111111111111111)';
      }
      if (!newMethod.nameOnCard || newMethod.nameOnCard.length < 3) {
        validationErrors.nameOnCard = 'Please enter the full name as shown on your card (e.g., John M. Doe)';
      }
      if (!newMethod.expiryDate || !/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(newMethod.expiryDate)) {
        validationErrors.expiryDate = 'Please enter a valid expiry date in MM/YY format (e.g., 12/25)';
      }
      if (!newMethod.cardType) {
        validationErrors.cardType = 'Please select your card type (VISA, MASTERCARD, or AMEX)';
      }
    } else if (newMethod.paymentType === 'upi') {
      if (!newMethod.upiId || !/^[a-zA-Z0-9.-]{2,256}@[a-zA-Z][a-zA-Z]{2,64}$/.test(newMethod.upiId)) {
        validationErrors.upiId = 'Please enter a valid UPI ID (e.g., john.doe@upi)';
      }
    } else if (newMethod.paymentType === 'banktransfer') {
      if (!newMethod.accountHolderName || newMethod.accountHolderName.length < 3) {
        validationErrors.accountHolderName = 'Please enter the complete account holder name (e.g., John M. Doe)';
      }
      if (!newMethod.bankAccountNumber || !/^\d{10,18}$/.test(newMethod.bankAccountNumber)) {
        validationErrors.bankAccountNumber = 'Please enter a valid bank account number (10-18 digits)';
      }
      if (!newMethod.ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(newMethod.ifscCode)) {
        validationErrors.bankIFSC = 'Please enter a valid IFSC code (e.g., HDFC0123456)';
      }
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleAdd = async () => {
    if (!validatePaymentMethod()) return;
    
    if (methods.length >= 4) {
      alert('Maximum 4 payment methods allowed');
      return;
    }

    let paymentData;
    if (newMethod.paymentType === 'creditcard' || newMethod.paymentType === 'debitcard') {
      paymentData = {
        paymentType: newMethod.paymentType,
        cardNumber: newMethod.maskedCardNumber,
        nameOnCard: newMethod.nameOnCard,
        expiryDate: formatDateForApi(newMethod.expiryDate || ''),
        cardType: newMethod.cardType
      };
    } else if (newMethod.paymentType === 'upi') {
      paymentData = {
        paymentType: 'upi',
        upiId: newMethod.upiId
      };
    } else if (newMethod.paymentType === 'banktransfer') {
      paymentData = {
        paymentType: 'banktransfer',
        accountHolderName: newMethod.accountHolderName,
        bankAccountNumber: newMethod.bankAccountNumber,
        ifscCode: newMethod.ifscCode
      };
    }

    try {
      const response = await fetch('http://localhost:8080/api/users/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        await fetchPaymentMethods();
        resetForm();
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        alert('Failed to add payment method. Please try again.');
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      alert('Failed to add payment method. Please try again.');
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setIsEditing(true);
    setShowForm(true);
    setEditingMethodId(method.id);
    
    // Format the method data for editing
    const formattedMethod = {
      ...method,
      expiryDate: method.expiryDate ? formatDateForDisplay(method.expiryDate) : method.expiryDate,
      // Ensure accountHolderName is properly set for bank transfer
    //  accountHolderName: method.accountHolderName || ''
    };
    setNewMethod(formattedMethod);
  };

  const handleSave = async () => {
    if (!validatePaymentMethod()) return;

    let updateData: any = {};
    if (newMethod.paymentType === 'creditcard' || newMethod.paymentType === 'debitcard') {
      updateData = {
        cardNumber: newMethod.maskedCardNumber,
        nameOnCard: newMethod.nameOnCard,
        expiryDate: formatDateForApi(newMethod.expiryDate || ''),
        cardType: newMethod.cardType
      };
    } else if (newMethod.paymentType === 'upi') {
      updateData = {
        upiId: newMethod.upiId
      };
    } else if (newMethod.paymentType === 'banktransfer') {
      updateData = {
        accountHolderName: newMethod.accountHolderName,
        bankAccountNumber: newMethod.bankAccountNumber,
        ifscCode: newMethod.ifscCode
      };
    }

    try {
      const response = await fetch(`http://localhost:8080/api/users/payments/${newMethod.paymentType}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await fetchPaymentMethods();
        resetForm();
      } else {
        const errorData = await response.json();
        console.error('Error updating payment method:', errorData);
        alert('Failed to update payment method. Please try again.');
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
      alert('Failed to update payment method. Please try again.');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setEditingMethodId(null);
    setNewMethod({ paymentType: 'creditcard' });
    setErrors({});
    setHasLocalChanges(false);
  };

  const handleCancel = () => {
    resetForm();
    if (hasLocalChanges) {
      onChange(originalMethods);
    }
  };

  const handleDelete = async (paymentType: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/users/payments/${paymentType}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        setSelectedMethodId(null);
        await fetchPaymentMethods();
      } else {
        alert('Failed to delete payment method. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      alert('Failed to delete payment method. Please try again.');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Payment Method</h2>
        {!showForm && methods.length < 4 && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Payment Method
          </button>
        )}
      </div>

      {hasLocalChanges && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-amber-600 text-sm">You have unsaved changes</p>
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-6 border rounded-lg bg-gray-50">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Payment Type
              </label>
              <select
                value={newMethod.paymentType}
                onChange={(e) =>
                  setNewMethod({ ...newMethod, paymentType: e.target.value as PaymentMethod['paymentType'] })
                }
                className="w-full rounded-lg border border-gray-300 shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500"
                disabled={isEditing}
              >
                <option value="creditcard">Credit Card</option>
                <option value="debitcard">Debit Card</option>
                <option value="upi">UPI</option>
                <option value="banktransfer">Bank Transfer</option>
              </select>
            </div>

            {(newMethod.paymentType === 'creditcard' || newMethod.paymentType === 'debitcard') ? (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Card Number
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={newMethod.maskedCardNumber || ''}
                    onChange={(e) =>
                      setNewMethod({ ...newMethod, maskedCardNumber: e.target.value.replace(/\D/g, '') })
                    }
                    className={`w-full rounded-lg border ${errors.maskedCardNumber ? 'border-red-500' : 'border-gray-300'} shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500`}
                    placeholder="Enter 16-digit card number"
                  />
                  {errors.maskedCardNumber && (
                    <p className="text-red-500 text-sm">{errors.maskedCardNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Name on Card
                  </label>
                  <input
                    type="text"
                    value={newMethod.nameOnCard || ''}
                    onChange={(e) =>
                      setNewMethod({ ...newMethod, nameOnCard: e.target.value })
                    }
                    className={`w-full rounded-lg border ${errors.nameOnCard ? 'border-red-500' : 'border-gray-300'} shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500`}
                    placeholder="Enter name as shown on card"
                  />
                  {errors.nameOnCard && (
                    <p className="text-red-500 text-sm">{errors.nameOnCard}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={newMethod.expiryDate || ''}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2, 4);
                        }
                        setNewMethod({ ...newMethod, expiryDate: value });
                      }}
                      className={`w-full rounded-lg border ${errors.expiryDate ? 'border-red-500' : 'border-gray-300'} shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500`}
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                    {errors.expiryDate && (
                      <p className="text-red-500 text-sm">{errors.expiryDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Card Type
                    </label>
                    <select
                      value={newMethod.cardType || ''}
                      onChange={(e) =>
                        setNewMethod({ ...newMethod, cardType: e.target.value })
                      }
                      className={`w-full rounded-lg border ${errors.cardType ? 'border-red-500' : 'border-gray-300'} shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="">Select Type</option>
                      <option value="VISA">Visa</option>
                      <option value="MASTERCARD">Mastercard</option>
                      <option value="AMEX">American Express</option>
                    </select>
                    {errors.cardType && (
                      <p className="text-red-500 text-sm">{errors.cardType}</p>
                    )}
                  </div>
                </div>
              </>
            ) : newMethod.paymentType === 'upi' ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  UPI ID
                </label>
                <input
                  type="text"
                  value={newMethod.upiId || ''}
                  onChange={(e) =>
                    setNewMethod({ ...newMethod, upiId: e.target.value })
                  }
                  className={`w-full rounded-lg border ${errors.upiId ? 'border-red-500' : 'border-gray-300'} shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500`}
                  placeholder="username@upi"
                />
                {errors.upiId && (
                  <p className="text-red-500 text-sm">{errors.upiId}</p>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={newMethod.accountHolderName || ''}
                    onChange={(e) =>
                      setNewMethod({ ...newMethod, accountHolderName: e.target.value })
                    }
                    className={`w-full rounded-lg border ${errors.accountHolderName ? 'border-red-500' : 'border-gray-300'} shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500`}
                    placeholder="Enter account holder name"
                  />
                  {errors.accountHolderName && (
                    <p className="text-red-500 text-sm">{errors.accountHolderName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={newMethod.bankAccountNumber || ''}
                    onChange={(e) =>
                      setNewMethod({ ...newMethod, bankAccountNumber: e.target.value.replace(/\D/g, '') })
                    }
                    className={`w-full rounded-lg border ${errors.bankAccountNumber ? 'border-red-500' : 'border-gray-300'} shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500`}
                    placeholder="Enter bank account number"
                  />
                  {errors.bankAccountNumber && (
                    <p className="text-red-500 text-sm">{errors.bankAccountNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={newMethod.ifscCode || ''}
                    onChange={(e) =>
                      setNewMethod({ ...newMethod, ifscCode: e.target.value.toUpperCase() })
                    }
                    className={`w-full rounded-lg border ${errors.bankIFSC ? 'border-red-500' : 'border-gray-300'} shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500`}
                    placeholder="Enter IFSC code"
                  />
                  {errors.bankIFSC && (
                    <p className="text-red-500 text-sm">{errors.bankIFSC}</p>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={isEditing ? handleSave : handleAdd}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {isEditing ? 'Save Changes' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {methods
          .filter(method => method.id !== editingMethodId)
          .map((method) => (
          <div
            key={method.id}
            className="p-6 border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="payment-method"
                  checked={selectedMethodId === method.id}
                  onChange={() => setSelectedMethodId(method.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <CreditCard className="h-6 w-6 text-gray-400" />
                <div>
                  {method.paymentType === 'upi' ? (
                    <p className="font-medium">{method.upiId}</p>
                  ) : method.paymentType === 'banktransfer' ? (
                    <>
                      <p className="font-medium">
                        {method.accountHolderName} - **** {method.bankAccountNumber?.slice(-4)}
                      </p>
                      <p className="text-sm text-gray-500">
                        IFSC: {method.ifscCode}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">
                        {method.nameOnCard} - **** {method.maskedCardNumber?.slice(-4)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Expires {formatDateForDisplay(method.expiryDate || '')} • {method.cardType}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">
                        {method.paymentType === 'creditcard' ? 'Credit Card' : 'Debit Card'}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(method)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(method.paymentType)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasLocalChanges && (
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <X className="h-4 w-4 mr-2 inline" />
            Cancel Changes
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2 inline" />
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}