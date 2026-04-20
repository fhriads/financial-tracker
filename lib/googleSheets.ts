'use server';

import { google } from 'googleapis';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

async function getAuthClient() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    throw new Error('Unauthorized: Sesi tidak valid atau token kadaluarsa');
  }
  
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: (session as any).accessToken });
  return google.sheets({ version: 'v4', auth });
}

export async function getSheetData(spreadsheetId: string, sheetRange: string) {
  try {
    const sheets = await getAuthClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetRange,
    });
    return response.data.values || [];
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) throw error;
    throw new Error('Sheet Not Found atau gagal mengambil data');
  }
}

export async function appendSheetData(spreadsheetId: string, sheetRange: string, transactionData: string[]) {
  try {
    const sheets = await getAuthClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [transactionData] },
    });
    return { success: true };
  } catch (error) {
    throw new Error('Gagal menyimpan data transaksi');
  }
}

export async function deleteSheetRow(spreadsheetId: string, sheetId: number, rowIndex: number) {
  try {
    const sheets = await getAuthClient();
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });
    return { success: true };
  } catch (error) {
    throw new Error('Gagal menghapus baris dari Google Sheets');
  }
}
