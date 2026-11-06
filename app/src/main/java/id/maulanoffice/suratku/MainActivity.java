package id.maulanoffice.suratku;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.ConsoleMessage;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.annotation.Nullable;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.Base64;

public class MainActivity extends Activity {
    private WebView webView;
    private WebViewAssetLoader assetLoader;
    private ValueCallback<Uri[]> fileCallback;
    private static final int FILE_CHOOSER = 901;
    private static final String APP_URL = "https://appassets.androidplatform.net/assets/www/index.html";

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(0xFFFAF9F5);
        getWindow().setNavigationBarColor(0xFFFAF9F5);
        if (Build.VERSION.SDK_INT >= 26) getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        assetLoader = new WebViewAssetLoader.Builder().addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        webView = new WebView(this);
        setContentView(webView);
        webView.setBackgroundColor(0xFFFAF9F5);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(true);
        webView.getSettings().setJavaScriptCanOpenWindowsAutomatically(true);
        webView.getSettings().setSupportZoom(false);
        webView.getSettings().setBuiltInZoomControls(false);
        webView.addJavascriptInterface(new AndroidDownload(), "AndroidDownload");
        webView.addJavascriptInterface(new AndroidPrint(), "AndroidPrint");
        webView.setWebViewClient(new WebViewClientCompat() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) { return assetLoader.shouldInterceptRequest(request.getUrl()); }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, String url) { return assetLoader.shouldInterceptRequest(Uri.parse(url)); }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u=request.getUrl();
                if ("appassets.androidplatform.net".equals(u.getHost())) return false;
                if ("http".equals(u.getScheme()) || "https".equals(u.getScheme())) { try { startActivity(new Intent(Intent.ACTION_VIEW,u)); } catch(Exception ignored){} return true; }
                return false;
            }
            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view,url);
                String js = "(function(){window.print=function(){if(window.AndroidPrint)AndroidPrint.printPage()};document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a[download]'):null;if(!a)return;var h=a.href||'',n=a.getAttribute('download')||'SURATKU-file';if(!h.startsWith('blob:')&&!h.startsWith('data:'))return;e.preventDefault();fetch(h).then(function(r){return r.blob()}).then(function(b){var fr=new FileReader();fr.onloadend=function(){var x=String(fr.result).split(',')[1]||'';AndroidDownload.save(x,n,b.type||'application/octet-stream')};fr.readAsDataURL(b)}).catch(function(){alert('Gagal menyiapkan file unduhan.')})},true)})();";
                view.evaluateJavascript(js,null);
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if(fileCallback!=null) fileCallback.onReceiveValue(null); fileCallback=cb;
                Intent i=params.createIntent(); try { startActivityForResult(i,FILE_CHOOSER); } catch(ActivityNotFoundException e){fileCallback=null; Toast.makeText(MainActivity.this,"Tidak ada aplikasi untuk memilih file",Toast.LENGTH_SHORT).show(); return false;} return true;
            }
            @Override public boolean onConsoleMessage(ConsoleMessage m) { android.util.Log.d("SURATKU-Web",m.message()+" @"+m.lineNumber()); return true; }
        });
        webView.setDownloadListener((url,ua,disposition,mime,length)->{
            if(url.startsWith("blob:")) { Toast.makeText(this,"Sedang menyiapkan unduhan…",Toast.LENGTH_SHORT).show(); return; }
            try { DownloadManager.Request req=new DownloadManager.Request(Uri.parse(url)); req.setMimeType(mime); req.addRequestHeader("Cookie", CookieManager.getInstance().getCookie(url)); req.setTitle("SURATKU"); req.setDescription("Mengunduh berkas"); req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED); req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, android.webkit.URLUtil.guessFileName(url,disposition,mime)); ((DownloadManager)getSystemService(DOWNLOAD_SERVICE)).enqueue(req); Toast.makeText(this,"Unduhan dimulai",Toast.LENGTH_SHORT).show(); } catch(Exception e){Toast.makeText(this,"Unduhan gagal: "+e.getMessage(),Toast.LENGTH_LONG).show();}
        });
        androidx.webkit.ServiceWorkerControllerCompat sw = androidx.webkit.ServiceWorkerControllerCompat.getInstance();
        sw.setServiceWorkerClient(new androidx.webkit.ServiceWorkerClientCompat() {
            @Override public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) { return assetLoader.shouldInterceptRequest(request.getUrl()); }
        });
        webView.loadUrl(APP_URL);
    }
    @Override public void onBackPressed(){ if(webView!=null && webView.canGoBack()) webView.goBack(); else super.onBackPressed(); }
    @Override protected void onActivityResult(int requestCode,int resultCode,@Nullable Intent data){super.onActivityResult(requestCode,resultCode,data); if(requestCode==FILE_CHOOSER && fileCallback!=null){Uri[] r=WebChromeClient.FileChooserParams.parseResult(resultCode,data);fileCallback.onReceiveValue(r);fileCallback=null;}}
    @Override protected void onDestroy(){if(webView!=null){webView.removeJavascriptInterface("AndroidDownload");webView.removeJavascriptInterface("AndroidPrint");webView.destroy();}super.onDestroy();}

    private class AndroidDownload {
        @JavascriptInterface public void save(String base64,String name,String mime){
            try { byte[] bytes=Base64.getDecoder().decode(base64); String safe=name==null?"SURATKU-file":name.replaceAll("[/\\\\:*?\"<>|]","_");
                if(Build.VERSION.SDK_INT>=29){ContentValues v=new ContentValues();v.put(MediaStore.Downloads.DISPLAY_NAME,safe);v.put(MediaStore.Downloads.MIME_TYPE,mime);v.put(MediaStore.Downloads.RELATIVE_PATH,Environment.DIRECTORY_DOWNLOADS+"/SURATKU");Uri uri=getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI,v);if(uri==null)throw new Exception("Tidak dapat membuat file");try(OutputStream os=getContentResolver().openOutputStream(uri)){os.write(bytes);}}
                else {File d=new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS),"SURATKU");d.mkdirs();try(FileOutputStream os=new FileOutputStream(new File(d,safe))){os.write(bytes);}}
                runOnUiThread(()->Toast.makeText(MainActivity.this,"Tersimpan di folder Download/SURATKU",Toast.LENGTH_LONG).show());
            }catch(Exception e){runOnUiThread(()->Toast.makeText(MainActivity.this,"Gagal menyimpan: "+e.getMessage(),Toast.LENGTH_LONG).show());}
        }
    }
    private class AndroidPrint {
        @JavascriptInterface public void printPage(){runOnUiThread(()->{try{PrintManager pm=(PrintManager)getSystemService(PRINT_SERVICE);android.print.PrintDocumentAdapter adapter=webView.createPrintDocumentAdapter("SURATKU");pm.print("SURATKU",adapter,new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).setResolution(new PrintAttributes.Resolution("pdf","pdf",300,300)).setMinMargins(PrintAttributes.Margins.NO_MARGINS).build());}catch(Exception e){Toast.makeText(MainActivity.this,"Fitur cetak tidak tersedia",Toast.LENGTH_SHORT).show();}});}
    }
}
