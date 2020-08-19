
//右击实体出现当前选中层数据
var viewerInfo = new Cesium.Viewer("viewerInfo", {
    animation: false, //是否显示动画控件
    homeButton: true, //是否显示home键
    geocoder: false, //是否显示地名查找控件
    baseLayerPicker: false, //是否显示图层选择控件
    timeline: false, //是否显示时间线控件
    fullscreenButton: false, //是否全屏显示
    scene3DOnly: true, //如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
    infoBox: true, //是否显示点击要素之后显示的信息
    sceneModePicker: true, //是否显示投影方式控件  三维/二维
    navigationInstructionsInitiallyVisible: false,
    navigationHelpButton: false, //是否显示帮助信息控件
    selectionIndicator: false, //是否显示指示器组件
});
viewerInfo.homeButton.viewModel.tooltip = "初始位置";

// viewerInfo.homeButton.viewModel.tooltip = "初始位置";

$(function () {
    // 默认位置
    var initialPosition = new Cesium.Cartesian3.fromDegrees(
        108.383627,
        22.790053,
        2000
    );
    var initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(
        7.1077496389876024807,
        -31.987223091598949054,
        0.025883251314954971306
    );
    //主页视图
    var homeCameraInfoView = {
        destination: initialPosition,
        orientation: {
            heading: initialOrientation.heading,
            pitch: initialOrientation.pitch,
            roll: initialOrientation.roll,
        },
    };
    //设置主页视图
    viewerInfo.scene.camera.setView(homeCameraInfoView);

    // Override the default home button
    //回到主页按钮
    viewerInfo.homeButton.viewModel.command.beforeExecute.addEventListener(function (
        e
    ) {
        e.cancel = true;
        viewerInfo.scene.camera.flyTo(homeCameraInfoView);
    });

    // HTML overlay for showing feature name on mouseover
    // 鼠标划过时显示
    var nameInfoOverlay = document.createElement("div");
    viewerInfo.container.appendChild(nameInfoOverlay);
    nameInfoOverlay.className = "backdrop";
    nameInfoOverlay.style.display = "none";
    nameInfoOverlay.style.position = "absolute";
    nameInfoOverlay.style.bottom = "0";
    nameInfoOverlay.style.left = "0";
    nameInfoOverlay.style["pointer-events"] = "none";
    nameInfoOverlay.style.padding = "4px";
    nameInfoOverlay.style.backgroundColor = "black";
    var selected = {
        feature: undefined,
        originalColor: new Cesium.Color(),
    };
    var selectedInfoEntity = new Cesium.Entity();

    // Get default left click handler for when a feature is not picked on left click
    // 获取默认的左击事件，用于左击未选择功能时
    var clickHandler = viewerInfo.screenSpaceEventHandler.getInputAction(
        Cesium.ScreenSpaceEventType.LEFT_CLICK
    );
    // 如果支持轮廓，则鼠标悬停时轮廓特征为蓝色，单击鼠标时轮廓为绿色
    if (
        Cesium.PostProcessStageLibrary.isSilhouetteSupported(viewerInfo.scene)
    ) {
        // Silhouettes are supported
        //支持
        var silhouetteInfoBlue = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
        silhouetteInfoBlue.uniforms.color = Cesium.Color.BLUE;
        silhouetteInfoBlue.uniforms.length = 0.01;
        silhouetteInfoBlue.selected = [];

        var silhouetteInfoGreen = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
        silhouetteInfoGreen.uniforms.color = Cesium.Color.LIME;
        silhouetteInfoGreen.uniforms.length = 0.01;
        silhouetteInfoGreen.selected = [];

        viewerInfo.scene.postProcessStages.add(
            Cesium.PostProcessStageLibrary.createSilhouetteStage([
                silhouetteInfoBlue,
                silhouetteInfoGreen,
            ])
        );
        // Silhouette a feature blue on hover.
        // 在悬停时为蓝色轮廓
        viewerInfo.screenSpaceEventHandler.setInputAction(function onMouseMove(
            movement
        ) {
            // If a feature was previously highlighted, undo the highlight
            // 取消选中实体
            silhouetteInfoBlue.selected = [];

            // Pick a new feature
            // 选择实体
            var pickedFeature = viewerInfo.scene.pick(movement.endPosition);
            if (!Cesium.defined(pickedFeature)) {
                nameInfoOverlay.style.display = "none";
                return;
            }

            // A feature was picked, so show it's overlay content
            // 悬停时显示label
            nameInfoOverlay.style.display = "block";
            nameInfoOverlay.style.bottom =
                viewerInfo.canvas.clientHeight - movement.endPosition.y + "px";
            nameInfoOverlay.style.left = movement.endPosition.x + "px";
            var name = pickedFeature.getProperty("id");
            nameInfoOverlay.textContent = name;

            // Highlight the feature if it's not already selected.
            // 高亮没有被选中的实体
            if (pickedFeature !== selected.feature) {
                silhouetteInfoBlue.selected = [pickedFeature];
            }
        },
            Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // Silhouette a feature on selection and show metadata in the InfoBox.
        // 选中实体并在信息框中显示信息
        viewerInfo.screenSpaceEventHandler.setInputAction(function onLeftClick(
            movement
        ) {
            // If a feature was previously selected, undo the highlight
            // 清空选中
            silhouetteInfoGreen.selected = [];

            // Pick a new feature
            // 选择实体
            var pickedFeature = viewerInfo.scene.pick(movement.position);
            if (!Cesium.defined(pickedFeature)) {
                clickHandler(movement);
                $("#viewerInfoPop .cesium-infoBox").removeClass("cesium-infoBox-visible");
                return;
            }

            // Select the feature if it's not already selected
            // 选择实体（如果该实体之前没有被选中）
            if (silhouetteInfoGreen.selected[0] === pickedFeature) {
                return;
            }

            // Save the selected feature's original color
            // 保存所选实体的原始颜色
            var highlightedFeature = silhouetteInfoBlue.selected[0];
            if (pickedFeature === highlightedFeature) {
                silhouetteInfoBlue.selected = [];
            }

            // Highlight newly selected feature
            // 选择的实体设置高亮
            silhouetteInfoGreen.selected = [pickedFeature];
            // Set feature infobox description
            // 设置所选实体显示的功能信息框
            var featureName = pickedFeature.getProperty("name");
            selectedInfoEntity.name = featureName;
            $("#viewerInfoPop .cesium-infoBox").addClass("cesium-infoBox-visible");
            var fileds = pickedFeature.getPropertyNames();
            $("#viewerInfoPop .cesium-infoBox-title").text(pickedFeature.getProperty(fileds[0]));
            var _trHTML = "";
            for (var i in fileds) {
                _trHTML += `<tr>
                    <th>${fileds[i]}</th>
                    <td>${pickedFeature.getProperty(fileds[i])}</td>
                </tr>`
            }
            $("#viewerInfoPop tbody").html(_trHTML);
        },
            Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    //关闭viewerInfo
    $("#closeViewerInfo").click(function () {
        $("#viewerInfo").fadeOut();
    })
    //关闭viewerInfo右侧弹窗
    $("#viewerInfoPop .cesium-infoBox-close").click(function(){
        $("#viewerInfoPop .cesium-infoBox").removeClass("cesium-infoBox-visible");
        silhouetteInfoGreen.selected = [];
    })

})


//右击实体获取当前右击实体详情
function getViewerInfo() {
    // silhouetteInfoBlue.selected = [];
    viewerInfo.imageryLayers.remove(viewerInfo.imageryLayers.get(0));
    viewerInfo.imageryLayers.removeAll();
    //加载数据
    var doorOptions = {
        clampToGround: true,
        geocoder: true,
    };
    var door = new Cesium.Cesium3DTileset({
        url: "./Source/SampleData/3dTiles/floor/tileset.json",
    });
    viewerInfo.flyTo(viewerInfo.scene.primitives.add(door, doorOptions));

    // layui.use(['layer'], function () {
    //     var layer = layui.layer;

    //     layer.open({
    //         type: 1,
    //         shade: [0.4, '#000'],
    //         title: '查看详情',
    //         area: ['90%', '90%'],
    //         content: $("#viewerInfo"), //这里content是一个普通的String
    //     });

    // })
}

